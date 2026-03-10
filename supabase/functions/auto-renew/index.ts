import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    const { data: expiredContracts, error: fetchError } = await supabase
      .from("contracts")
      .select("*")
      .eq("auto_renew", true)
      .eq("status", "Aktivt")
      .lte("end_date", today);

    if (fetchError) throw fetchError;

    const renewed: string[] = [];

    for (const contract of expiredContracts || []) {
      const oldEnd = new Date(contract.end_date);
      const newStart = new Date(oldEnd);
      newStart.setDate(newStart.getDate() + 1);

      // Use binding_months as the configurable renewal period
      const renewalMonths = contract.binding_months || 12;
      const newEnd = new Date(newStart);
      newEnd.setMonth(newEnd.getMonth() + renewalMonths);

      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          start_date: newStart.toISOString().split("T")[0],
          end_date: newEnd.toISOString().split("T")[0],
          status: "Aktivt",
        })
        .eq("id", contract.id);

      if (updateError) {
        console.error(`Failed to renew ${contract.id}:`, updateError);
        continue;
      }

      renewed.push(contract.contract_name);

      // Notify the internal responsible person
      if (contract.internal_responsible) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .ilike("full_name", contract.internal_responsible);

        if (matchedProfiles && matchedProfiles.length > 0) {
          await supabase.from("notifications").insert({
            user_id: matchedProfiles[0].id,
            title: "Avtal förnyat automatiskt",
            body: `Avtalet "${contract.contract_name}" har förnyats automatiskt med ${renewalMonths} månader. Ny period: ${newStart.toISOString().split("T")[0]} – ${newEnd.toISOString().split("T")[0]}.`,
            type: "renewal",
            link: `/avtal/${contract.id}`,
          });
          console.log(`Notification sent to ${matchedProfiles[0].full_name} for contract ${contract.contract_name}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${expiredContracts?.length || 0} contracts, renewed ${renewed.length}`,
        renewed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Auto-renewal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
