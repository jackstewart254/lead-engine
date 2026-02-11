import { getSupabase } from "@lead-engine/shared";
import type { Prospect, Campaign, EmailSent, Lead } from "@lead-engine/shared";

export async function getProspects(): Promise<Prospect[]> {
  const { data, error } = await getSupabase()
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEmailsSent(): Promise<(EmailSent & { prospect?: Prospect })[]> {
  const { data, error } = await getSupabase()
    .from("emails_sent")
    .select("*, prospect:prospects(*)")
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLeads(): Promise<(Lead & { prospect?: Prospect })[]> {
  const { data, error } = await getSupabase()
    .from("leads")
    .select("*, prospect:prospects(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getStats() {
  const supabase = getSupabase();
  const [prospects, enriched, emails, leads] = await Promise.all([
    supabase.from("prospects").select("id", { count: "exact", head: true }),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .or("owner_email.not.is.null,general_email.not.is.null"),
    supabase.from("emails_sent").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);
  return {
    totalProspects: prospects.count ?? 0,
    enriched: enriched.count ?? 0,
    emailsSent: emails.count ?? 0,
    totalLeads: leads.count ?? 0,
  };
}

export async function getUnenrichedCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .not("website", "is", null)
    .is("owner_email", null)
    .is("general_email", null);
  if (error) throw error;
  return count ?? 0;
}
