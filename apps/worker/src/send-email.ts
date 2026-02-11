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
  followUpNumber?: number;
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
  const { to, subject, html, prospectId, campaignId, followUpNumber = 0 } = params;
  const emailId = randomUUID();

  const trackedHtml = injectTracking(html, emailId);

  const token = await getGraphToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${OUTLOOK_SENDER_EMAIL}/sendMail`,
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
  const supabase = getSupabase();
  const { error } = await supabase.from("emails_sent").insert({
    id: emailId,
    prospect_id: prospectId,
    campaign_id: campaignId,
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
