import { getSupabase, type Campaign, type Prospect, type EmailAccount, type Person } from "@lead-engine/shared";
import { sendEmail } from "./send-email";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FALLBACKS: Record<string, string> = {
  first_name: "there",
  owner_name: "there",
};

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = vars[key];
    if (value) return value;
    return FALLBACKS[key] ?? "";
  });
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

  // Resolve email account if set
  let emailAccount: EmailAccount | null = null;
  if (campaign.email_account_id) {
    const { data, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", campaign.email_account_id)
      .single<EmailAccount>();

    if (error || !data) {
      console.warn(`Email account ${campaign.email_account_id} not found, falling back to env vars`);
    } else {
      emailAccount = data;
      console.log(`Using email account: ${emailAccount.label} (${emailAccount.sender_email})`);
    }
  } else {
    console.log("No email account set, using default env var credentials");
  }

  console.log(`Running campaign: ${campaign.name}`);

  // Check for manual recipients (campaign_people)
  const { data: campaignPeople } = await supabase
    .from("campaign_people")
    .select("*, person:people(*, prospect:prospects(*))")
    .eq("campaign_id", campaignId);

  if (campaignPeople && campaignPeople.length > 0) {
    // Manual mode: send to specific people
    console.log(`Manual mode: ${campaignPeople.length} recipients`);

    // Deduplication: check already-emailed people
    const { data: alreadySent } = await supabase
      .from("emails_sent")
      .select("person_id")
      .eq("campaign_id", campaignId)
      .not("person_id", "is", null);

    const sentPersonIds = new Set((alreadySent ?? []).map((e) => e.person_id));
    const toEmail = campaignPeople.filter((cp) => {
      const person = cp.person as any as (Person & { prospect: Prospect });
      return person?.email && !sentPersonIds.has(person.id);
    });

    console.log(`${campaignPeople.length} recipients, ${sentPersonIds.size} already emailed, ${toEmail.length} to send`);

    let sent = 0;
    for (const cp of toEmail) {
      const person = cp.person as any as (Person & { prospect: Prospect });
      const prospect = person.prospect;

      const nameParts = person.name.split(" ");
      const firstName = person.first_name ?? nameParts[0] ?? "";

      const html = renderTemplate(campaign.email_template, {
        business_name: prospect.business_name,
        owner_name: person.name,
        first_name: firstName,
        role: person.role ?? "",
        linkedin_url: person.linkedin_url ?? "",
        website: prospect.website ?? "",
        category: prospect.category,
        location: prospect.location,
      });

      const subject = renderTemplate(campaign.name, {
        business_name: prospect.business_name,
        owner_name: person.name,
        first_name: firstName,
      });

      try {
        await sendEmail({
          to: person.email!,
          subject,
          html,
          prospectId: prospect.id,
          campaignId: campaign.id,
          personId: person.id,
          ...(emailAccount && {
            emailAccountId: emailAccount.id,
            senderEmail: emailAccount.sender_email,
            azureCredentials: {
              azure_tenant_id: emailAccount.azure_tenant_id,
              azure_client_id: emailAccount.azure_client_id,
              azure_client_secret: emailAccount.azure_client_secret,
            },
          }),
        });
        sent++;
      } catch (err) {
        console.error(`Failed to email ${person.email}:`, err);
      }

      if (sent < toEmail.length) {
        await sleep(3000);
      }
    }

    console.log(`Campaign complete: ${sent}/${toEmail.length} emails sent (manual mode)`);
  } else {
    // Legacy mode: query by category/location
    console.log("Legacy mode: targeting by category/location");

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

      const subject = renderTemplate(campaign.name, {
        business_name: prospect.business_name,
        owner_name: prospect.owner_name ?? "",
      });

      try {
        await sendEmail({
          to: prospect.owner_email!,
          subject,
          html,
          prospectId: prospect.id,
          campaignId: campaign.id,
          ...(emailAccount && {
            emailAccountId: emailAccount.id,
            senderEmail: emailAccount.sender_email,
            azureCredentials: {
              azure_tenant_id: emailAccount.azure_tenant_id,
              azure_client_id: emailAccount.azure_client_id,
              azure_client_secret: emailAccount.azure_client_secret,
            },
          }),
        });
        sent++;
      } catch (err) {
        console.error(`Failed to email ${prospect.owner_email}:`, err);
      }

      if (sent < toEmail.length) {
        await sleep(3000);
      }
    }

    console.log(`Campaign complete: ${sent}/${toEmail.length} emails sent (legacy mode)`);
  }
}
