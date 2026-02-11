import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), "../../.env") });
import { searchBusinesses } from "./google-places";
import { storeProspects } from "./store-prospects";
import { runCampaign } from "./run-campaign";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "scrape": {
      const category = process.argv[3] ?? "dentists";
      const location = process.argv[4] ?? "Glasgow";
      console.log(`Searching Google Places for "${category}" in "${location}"...`);
      const results = await searchBusinesses(category, location);
      console.log(`Found ${results.length} results total`);
      if (results.length > 0) {
        await storeProspects(results, category, location);
      }
      break;
    }
    case "send": {
      const campaignId = process.argv[3];
      if (!campaignId) {
        console.error("Usage: npx tsx src/index.ts send <campaignId>");
        process.exit(1);
      }
      await runCampaign(campaignId);
      break;
    }
    default:
      console.error("Usage: npx tsx src/index.ts <scrape|send> [args...]");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
