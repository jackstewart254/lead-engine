import { getSupabase, type Campaign, type Prospect } from "@lead-engine/shared";
import { sendEmail } from "./send-email";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? "");
}

export async function runCampaign(campaignId: string) {
  const supabase = getSupabase();

  // Fetch campaign
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single<Campaign>();

  if (campErr || !campaign) {
    throw new Error(`Campaign not found: ${campErr?.message ?? "no data"}`);
  }

  if (campaign.status !== "active") {
    throw new Error(`Campaign "${campaign.name}" is ${campaign.status}, not active`);
  }

  console.log(`Running campaign: ${campaign.name}`);

  // Fetch verified prospects matching category + location
  const { data: prospects, error: prospErr } = await supabase
    .from("prospects")
    .select("*")
    .eq("category", campaign.target_category)
    .eq("location", campaign.target_location)
    .eq("email_verified", true)
    .not("owner_email", "is", null)
    .returns<Prospect[]>();

  if (prospErr) {
    throw new Error(`Failed to fetch prospects: ${prospErr.message}`);
  }

  if (!prospects || prospects.length === 0) {
    console.log("No verified prospects found for this campaign.");
    return;
  }

  // Get already-emailed prospect IDs for this campaign
  const { data: alreadySent } = await supabase
    .from("emails_sent")
    .select("prospect_id")
    .eq("campaign_id", campaignId);

  const sentIds = new Set((alreadySent ?? []).map((e) => e.prospect_id));
  const toEmail = prospects.filter((p) => !sentIds.has(p.id));

  console.log(
    `${prospects.length} verified prospects, ${sentIds.size} already emailed, ${toEmail.length} to send`
  );

  let sent = 0;
  for (const prospect of toEmail) {
    const html = renderTemplate(campaign.email_template, {
      business_name: prospect.business_name,
      owner_name: prospect.owner_name ?? "",
      website: prospect.website ?? "",
      category: prospect.category,
      location: prospect.location,
    });

    const subject = renderTemplate(
      campaign.name, // Use campaign name as subject line
      {
        business_name: prospect.business_name,
        owner_name: prospect.owner_name ?? "",
      }
    );

    try {
      await sendEmail({
        to: prospect.owner_email!,
        subject,
        html,
        prospectId: prospect.id,
        campaignId: campaign.id,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to email ${prospect.owner_email}:`, err);
    }

    // Rate limit: 3s between emails
    if (sent < toEmail.length) {
      await sleep(3000);
    }
  }

  console.log(`Campaign complete: ${sent}/${toEmail.length} emails sent`);
}
