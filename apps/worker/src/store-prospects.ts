import { getSupabase } from "@lead-engine/shared";
import type { GooglePlacesResult } from "@lead-engine/shared";

export async function storeProspects(
  results: GooglePlacesResult[],
  category: string,
  location: string
) {
  const rows = results.map((place) => ({
    google_place_id: place.id,
    business_name: place.displayName.text,
    category,
    location,
    website: place.websiteUri ?? null,
    phone: place.nationalPhoneNumber ?? null,
    google_rating: place.rating ?? null,
  }));

  const { data, error } = await getSupabase()
    .from("prospects")
    .upsert(rows, { onConflict: "google_place_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }

  const inserted = data?.length ?? 0;
  const skipped = results.length - inserted;
  console.log(`Stored ${inserted} new prospects (${skipped} duplicates skipped)`);

  return { inserted, skipped };
}
