import type { GooglePlacesResult, GooglePlacesResponse } from "@lead-engine/shared";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";
const MAX_PAGES = 3;
const PAGE_DELAY_MS = 2000;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.types",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchBusinesses(
  category: string,
  location: string
): Promise<GooglePlacesResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY must be set");
  }

  const allResults: GooglePlacesResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const body: Record<string, string> = {
      textQuery: `${category} in ${location}`,
    };
    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Places API error (${response.status}): ${text}`);
    }

    const data: GooglePlacesResponse = await response.json();

    if (data.places) {
      allResults.push(...data.places);
      console.log(`  Page ${page + 1}: ${data.places.length} results`);
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;

    if (page < MAX_PAGES - 1) {
      await delay(PAGE_DELAY_MS);
    }
  }

  return allResults;
}
