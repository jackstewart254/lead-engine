import { randomUUID } from "crypto";
import { getSupabase } from "@lead-engine/shared";
import { getGraphToken } from "./graph-auth";

const TRACKING_BASE_URL = process.env.TRACKING_BASE_URL!;
const OUTLOOK_SENDER_EMAIL = process.env.OUTLOOK_SENDER_EMAIL!;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  prospectId: string;
  campaignId: string;
  personId?: string;
  followUpNumber?: number;
  emailAccountId?: string;
  senderEmail?: string;
  azureCredentials?: {
    azure_tenant_id: string;
    azure_client_id: string;
    azure_client_secret: string;
  };
}

const P_STYLE = 'style="margin: 0 0 14px 0; font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1a1a1a;"';
const LI_STYLE = 'style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1a1a1a; margin-bottom: 6px;"';

export function textToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((paragraph) => {
      const lines = paragraph.split("\n");
      const isList = lines.every((l) => /^[-•]\s/.test(l.trim()));

      if (isList) {
        const items = lines
          .map((l) => `<li ${LI_STYLE}>${l.trim().replace(/^[-•]\s+/, "")}</li>`)
          .join("\n");
        return `<ul style="margin: 0 0 14px 0; padding-left: 24px;">\n${items}\n</ul>`;
      }

      const withBreaks = paragraph.replace(/\n/g, "<br>");
      return `<p ${P_STYLE}>${withBreaks}</p>`;
    })
    .join("\n");
}

export function wrapEmail(bodyHtml: string): string {
  const signature = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 14.5px; line-height: 1.4;">
  <tr><td style="padding-bottom: 8px; border-bottom: 2px solid #2a2a2a;">
    <span style="font-size: 15px; font-weight: 700; color: #1a1a1a;">Jack Stewart</span><br>
    <span style="font-size: 13px; color: #555;">Founder, Mclean Stewart</span>
  </td></tr>
  <tr><td style="padding-top: 8px;">
    <span style="font-size: 13px; color: #555;">07432 205342 &nbsp;|&nbsp; jack@mcleanstewart.co.uk</span><br>
    <a href="https://mcleanstewart.co.uk" style="font-size: 13px; color: #2a6496; text-decoration: none;">mcleanstewart.co.uk</a>
  </td></tr>
  <tr><td style="padding-top: 10px;">
    <span style="font-size: 12px; color: #888;">Websites &amp; Inbound Marketing &nbsp;&bull;&nbsp; Bespoke Software &nbsp;&bull;&nbsp; AI Integration</span>
  </td></tr>
</table>
`.trim();

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
<div style="max-width: 600px; padding: 20px 0;">
${bodyHtml}
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
${signature}
</div>
</div>
</body>
</html>`;
}

export function injectTracking(html: string, emailId: string): string {
  const pixelUrl = `${TRACKING_BASE_URL}?type=open&id=${emailId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

  // Rewrite <a href="..."> links through tracking redirect
  const rewritten = html.replace(
    /<a\s([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi,
    (_match, before, url, after) => {
      const trackUrl = `${TRACKING_BASE_URL}?type=click&id=${emailId}&url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackUrl}"${after}>`;
    }
  );

  // Inject pixel before </body> or at the end
  if (rewritten.includes("</body>")) {
    return rewritten.replace("</body>", `${pixel}</body>`);
  }
  return rewritten + pixel;
}

export async function sendEmail(params: SendEmailParams): Promise<string> {
  const {
    to,
    subject,
    html,
    prospectId,
    campaignId,
    personId,
    followUpNumber = 0,
    emailAccountId,
    senderEmail,
    azureCredentials,
  } = params;
  const emailId = randomUUID();

  const formattedHtml = wrapEmail(textToHtml(html));
  const trackedHtml = injectTracking(formattedHtml, emailId);
  const sender = senderEmail ?? OUTLOOK_SENDER_EMAIL;

  const token = await getGraphToken(azureCredentials);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: trackedHtml },
          toRecipients: [{ emailAddress: { address: to } }],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${body}`);
  }

  // Log to emails_sent
  // conversation_id is populated later via lazy backfill when a reply arrives
  const supabase = getSupabase();
  const { error } = await supabase.from("emails_sent").insert({
    id: emailId,
    prospect_id: prospectId,
    campaign_id: campaignId,
    person_id: personId ?? null,
    email_account_id: emailAccountId ?? null,
    email_content: trackedHtml,
    subject,
    sent_at: new Date().toISOString(),
    opened: false,
    open_count: 0,
    replied: false,
    bounced: false,
    clicked: false,
    follow_up_number: followUpNumber,
  });

  if (error) {
    console.error("Failed to log email to Supabase:", error.message);
  }

  console.log(`Email sent to ${to} (id: ${emailId})`);
  return emailId;
}
