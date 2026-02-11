import { getSupabase, type Prospect } from "@lead-engine/shared";
import { crawlWebsite } from "./crawl-website";
import { extractContacts } from "./extract-contacts";
import { CostTracker, estimateCost, estimateTokens } from "./token-calculator";
import fs from "fs";
import path from "path";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const DELAY_MS = 1000;
const STATUS_FILE = path.resolve(process.cwd(), ".enrich-status.json");

interface EnrichStatus {
  running: boolean;
  current: number;
  total: number;
  businessName: string;
  enriched: number;
  failed: number;
  skipped: number;
}

function writeStatus(status: EnrichStatus) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status));
}

function clearStatus() {
  try {
    fs.unlinkSync(STATUS_FILE);
  } catch {}
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichProspects() {
  const supabase = getSupabase();
  const tracker = new CostTracker(MODEL);

  // Fetch prospects that have a website but no owner_email AND no general_email yet
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("*")
    .not("website", "is", null)
    .is("owner_email", null)
    .is("general_email", null)
    .returns<Prospect[]>();

  if (error) throw new Error(`Failed to fetch prospects: ${error.message}`);
  if (!prospects || prospects.length === 0) {
    console.log("No prospects to enrich.");
    clearStatus();
    return;
  }

  console.log(`Enriching ${prospects.length} prospects...\n`);

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (const prospect of prospects) {
    const current = enriched + failed + skipped + 1;
    console.log(`[${current}/${prospects.length}] ${prospect.business_name}`);
    writeStatus({
      running: true,
      current,
      total: prospects.length,
      businessName: prospect.business_name,
      enriched,
      failed,
      skipped,
    });

    // Crawl
    const crawl = await crawlWebsite(prospect.website!);
    if (!crawl) {
      console.log(`  ⏭ Could not crawl ${prospect.website}`);
      await supabase
        .from("prospects")
        .update({ website_status: "none" })
        .eq("id", prospect.id);
      skipped++;
      continue;
    }

    console.log(
      `  Crawled ${crawl.pagesCrawled} pages, ${crawl.totalChars} chars → ~${estimateTokens(crawl.text).toLocaleString()} tokens`
    );

    // Extract
    try {
      const { contact, inputTokens, outputTokens } = await extractContacts(
        crawl.text,
        prospect.business_name
      );
      tracker.addCall(inputTokens, outputTokens);

      // Record API usage in Supabase
      await supabase.from("api_usage").insert({
        prospect_id: prospect.id,
        model: MODEL,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimateCost(inputTokens, outputTokens, MODEL),
      });

      // Update prospect in Supabase
      const update: Record<string, unknown> = {
        website_status: "active",
        owner_name: contact.owner_name,
        owner_email: contact.owner_email,
        general_email: contact.general_email,
        owner_source: contact.owner_source,
      };

      await supabase.from("prospects").update(update).eq("id", prospect.id);

      if (contact.owner_email) {
        console.log(`  ✓ Found: ${contact.owner_name ?? "?"} <${contact.owner_email}>`);
        enriched++;
      } else if (contact.general_email) {
        console.log(`  ~ General email only: ${contact.general_email}`);
        enriched++;
      } else {
        console.log(`  ✗ No email found`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ✗ Extraction failed:`, err);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone: ${enriched} enriched, ${skipped} skipped, ${failed} failed`);
  console.log(tracker.summary());
  clearStatus();
}
