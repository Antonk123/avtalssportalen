const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org_number } = await req.json();

    if (!org_number || typeof org_number !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Organisationsnummer krävs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl är inte konfigurerad' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleaned = org_number.replace(/[\s-]/g, '');

    if (!/^\d{10}$/.test(cleaned)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ogiltigt organisationsnummer. Ange 10 siffror.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://www.allabolag.se/${cleaned}`;
    console.log('Looking up company:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              company_name: { type: 'string', description: 'The registered company name (firma)' },
              org_number: { type: 'string', description: 'The organization number (organisationsnummer)' },
              address: { type: 'string', description: 'The street address (gatuadress)' },
              postal_code: { type: 'string', description: 'The postal code (postnummer)' },
              city: { type: 'string', description: 'The city (ort/stad)' },
            },
            required: ['company_name'],
          },
        },
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Firecrawl-fel: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extracted = data?.data?.extract || data?.extract;

    if (!extracted || !extracted.company_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kunde inte hitta företaget. Kontrollera organisationsnumret.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Company found:', extracted.company_name);

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in company-lookup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
