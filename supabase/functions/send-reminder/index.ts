import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReminderPayload {
  contract_id?: string;
  cron?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error("SMTP-konfiguration saknas. Kontrollera SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load settings
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    const senderName = settings?.sender_name || "Avtalsportalen";
    // Always use SMTP_USER as sender to avoid SendAsDenied errors in Microsoft 365
    const senderEmail = SMTP_USER;
    const emailTemplate =
      settings?.email_template ||
      `Hej {{kontaktperson}},\n\nDetta är en påminnelse om att avtalet "{{avtalsnamn}}" med {{kundnamn}} löper ut den {{slutdatum}}.\n\nSista dag för uppsägning är {{uppsägningsdatum}}.\n\nMed vänliga hälsningar,\nAvtalsportalen`;

    const body: ReminderPayload = await req.json().catch(() => ({}));

    // Get the calling user's email from the Authorization header (for manual sends)
    let callerEmail: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && !body.cron) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: callerUser } } = await supabase.auth.getUser(token);
      callerEmail = callerUser?.email || null;
      console.log(`Manual send triggered by: ${callerEmail}`);
    }

    // Build list of contracts to remind about
    let contractIds: string[] = [];

    if (body.contract_id) {
      contractIds = [body.contract_id];
    } else {
      // Cron mode: find all active contracts within reminder window
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*")
        .eq("status", "Aktivt");

      const today = new Date();
      for (const c of contracts || []) {
        const endDate = new Date(c.end_date);
        const noticeDate = new Date(endDate);
        noticeDate.setMonth(noticeDate.getMonth() - c.notice_months);
        const daysUntilNotice = Math.floor(
          (noticeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilNotice <= c.reminder_days && daysUntilNotice >= 0) {
          const todayStr = today.toISOString().split("T")[0];
          const { data: existing } = await supabase
            .from("reminder_log")
            .select("id")
            .eq("contract_id", c.id)
            .gte("sent_at", todayStr + "T00:00:00")
            .lte("sent_at", todayStr + "T23:59:59");

          if (!existing || existing.length === 0) {
            contractIds.push(c.id);
          }
        }
      }
    }

    if (contractIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "Inga påminnelser att skicka." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Setup nodemailer transporter (Microsoft 365 compatible)
    const port = parseInt(SMTP_PORT);
    console.log(`SMTP config: host=${SMTP_HOST}, port=${port}, user=${SMTP_USER}`);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
      requireTLS: port === 587,
    });

    const results: { contract_id: string; success: boolean; error?: string }[] = [];

    for (const contractId of contractIds) {
      try {
        const { data: contract } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (!contract) {
          results.push({ contract_id: contractId, success: false, error: "Avtal hittades inte" });
          continue;
        }

        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", contract.customer_id)
          .single();

        // Determine recipient: send to the internal responsible person
        let recipientEmail = "";
        let contactName = "";

        if (body.contract_id && callerEmail) {
          // Manual send: send to the person who triggered it
          recipientEmail = callerEmail;
          // Look up the caller's full name from profiles
          const { data: callerProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", (await supabase.auth.getUser(req.headers.get("authorization")!.replace("Bearer ", ""))).data.user?.id)
            .single();
          contactName = callerProfile?.full_name || contract.internal_responsible || callerEmail;
        } else {
          // Cron mode: try to find internal responsible user's email via profiles
          if (contract.internal_responsible) {
            const { data: matchedProfiles } = await supabase
              .from("profiles")
              .select("id, full_name")
              .ilike("full_name", contract.internal_responsible);

            if (matchedProfiles && matchedProfiles.length > 0) {
              const { data: { user: matchedUser } } = await supabase.auth.admin.getUserById(matchedProfiles[0].id);
              if (matchedUser?.email) {
                recipientEmail = matchedUser.email;
                contactName = matchedProfiles[0].full_name || matchedUser.email;
              }
            }
          }
        }

        if (!recipientEmail) {
          const err = "Ingen intern ansvarigs e-post kunde hittas";
          await supabase.from("reminder_log").insert({
            contract_id: contractId,
            sent_to_email: "",
            success: false,
            error_message: err,
          });
          results.push({ contract_id: contractId, success: false, error: err });
          continue;
        }

        const endDate = new Date(contract.end_date);
        const noticeDate = new Date(endDate);
        noticeDate.setMonth(noticeDate.getMonth() - contract.notice_months);

        const contractUrl = `https://avtalssportalen.lovable.app/avtal/${contractId}`;

        const textBody = emailTemplate
          .replace(/\{\{kontaktperson\}\}/g, contactName || "ansvarig")
          .replace(/\{\{avtalsnamn\}\}/g, contract.contract_name)
          .replace(/\{\{kundnamn\}\}/g, customer?.company_name || "")
          .replace(/\{\{slutdatum\}\}/g, contract.end_date)
          .replace(/\{\{uppsägningsdatum\}\}/g, noticeDate.toISOString().split("T")[0])
          .replace(/\{\{avtalslänk\}\}/g, `Länk till avtal: ${contractUrl}`);

        // Fetch login logo from branding bucket
        let logoUrl = "https://avtalssportalen.lovable.app/images/pfm-icon.png"; // fallback
        try {
          const { data: logoFiles } = await supabase.storage.from("branding").list("", { search: "login-logo" });
          const logoFile = logoFiles?.find(f => f.name.startsWith("login-logo"));
          if (logoFile) {
            const { data: urlData } = supabase.storage.from("branding").getPublicUrl(logoFile.name);
            if (urlData?.publicUrl) logoUrl = urlData.publicUrl;
          }
        } catch (e) {
          console.log("Could not fetch branding logo, using fallback:", e);
        }

        const htmlBody = `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg, #1c2a2f 0%, #243b3f 100%);padding:28px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:14px;vertical-align:middle;"><img src="${logoUrl}" alt="PFM" width="36" height="36" style="display:block;border-radius:8px;" /></td>
            <td style="vertical-align:middle;"><span style="color:#ffffff;font-size:20px;font-weight:600;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Prefabmästarna</span><br/><span style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:0.5px;">Avtalsportalen</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:36px 40px 20px;">
          <p style="margin:0 0 20px;color:#1a1a2e;font-size:15px;line-height:1.6;">Hej ${contactName || "ansvarig"},</p>
          <p style="margin:0 0 20px;color:#3a3a4a;font-size:15px;line-height:1.6;">
            Detta är en påminnelse om att avtalet <strong>"${contract.contract_name}"</strong> med <strong>${customer?.company_name || ""}</strong> löper ut den <strong>${contract.end_date}</strong>.
          </p>
          <p style="margin:0 0 28px;color:#3a3a4a;font-size:15px;line-height:1.6;">
            Sista dag för uppsägning är <strong>${noticeDate.toISOString().split("T")[0]}</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background-color:#2a7a6f;border-radius:8px;padding:14px 32px;text-align:center;">
              <a href="${contractUrl}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">Öppna avtalet →</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#8a8a9a;font-size:13px;line-height:1.5;">Vänligen vidta åtgärd för att säkerställa att avtalet hanteras i tid.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #eeeef0;">
          <p style="margin:0 0 8px;color:#8a8a9a;font-size:12px;">Med vänliga hälsningar,<br/>${senderName}</p>
          <p style="margin:0;color:#b0b0ba;font-size:11px;">Skickat via Avtalsportalen</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        console.log(`Sending reminder to ${recipientEmail} for contract ${contract.contract_name}`);

        await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: recipientEmail,
          subject: `Påminnelse: ${contract.contract_name} — uppsägningsfrist närmar sig`,
          text: textBody,
          html: htmlBody,
        });

        await supabase.from("reminder_log").insert({
          contract_id: contractId,
          sent_to_email: recipientEmail,
          success: true,
        });

        results.push({ contract_id: contractId, success: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Okänt fel";
        console.error(`Error sending to contract ${contractId}:`, errorMsg);
        await supabase.from("reminder_log").insert({
          contract_id: contractId,
          sent_to_email: "",
          success: false,
          error_message: errorMsg,
        });
        results.push({ contract_id: contractId, success: false, error: errorMsg });
      }
    }

    transporter.close();

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Okänt fel";
    console.error("send-reminder error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
