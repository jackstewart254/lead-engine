import { getSupabase, type Prospect } from "@lead-engine/shared";
import { processProspect, type PipelineResult } from "./index";
import { CostTracker } from "../token-calculator";
import { caffeinate } from "../caffeinate";
import fs from "fs";
import path from "path";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const DELAY_MS = 1_000;
const STATUS_FILE = path.resolve(process.cwd(), ".find-emails-status.json");

interface FindEmailsStatus {
  running: boolean;
  current: number;
  total: number;
  businessName: string;
  complete: number;
  partial: number;
  failed: number;
  currentStep: string;
  emailsVerified: number;
  emailsFound: number;
  currentOwner: string | null;
}

function writeStatus(status: FindEmailsStatus) {
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

function parseArgs(args: string[]): { limit: number; location?: string; category?: string } {
  let limit = 10;
  let location: string | undefined;
  let category: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--location" && args[i + 1]) {
      location = args[i + 1];
      i++;
    } else if (args[i] === "--category" && args[i + 1]) {
      category = args[i + 1];
      i++;
    }
  }

  return { limit, location, category };
}

export async function findEmails(args: string[]) {
  const { limit, location, category } = parseArgs(args);
  const supabase = getSupabase();
  const tracker = new CostTracker(MODEL);

  // Query eligible prospects
  let query = supabase
    .from("prospects")
    .select("*")
    .not("website", "is", null)
    .is("pipeline_status", null);

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }
  if (category) {
    query = query.ilike("category", `%${category}%`);
  }

  const { data: prospects, error } = await query
    .limit(limit)
    .returns<Prospect[]>();

  if (error) throw new Error(`Failed to fetch prospects: ${error.message}`);
  if (!prospects || prospects.length === 0) {
    console.log("No eligible prospects found.");
    clearStatus();
    return;
  }

  const decaf = caffeinate();
  console.log(`Processing ${prospects.length} prospects...\n`);

  const results: PipelineResult[] = [];
  let complete = 0;
  let partial = 0;
  let failed = 0;
  let emailsVerified = 0;
  let emailsFound = 0;
  let currentStep = "";
  let currentOwner: string | null = null;

  for (const prospect of prospects) {
    const current = results.length + 1;
    console.log(`\n[${current}/${prospects.length}] ${prospect.business_name}`);
    console.log(`  Website: ${prospect.website}`);

    currentStep = "crawling";
    currentOwner = null;

    writeStatus({
      running: true,
      current,
      total: prospects.length,
      businessName: prospect.business_name,
      complete,
      partial,
      failed,
      currentStep,
      emailsVerified,
      emailsFound,
      currentOwner,
    });

    const onStatus = (step: string, detail?: string) => {
      currentStep = step;
      if (detail) currentOwner = detail;
      writeStatus({
        running: true,
        current,
        total: prospects.length,
        businessName: prospect.business_name,
        complete,
        partial,
        failed,
        currentStep,
        emailsVerified,
        emailsFound,
        currentOwner,
      });
    };

    const result = await processProspect(prospect, tracker, onStatus);
    results.push(result);

    // Update running totals
    if (result.ownerEmail) emailsFound++;
    if (result.ownerEmailStatus === "verified") emailsVerified++;

    switch (result.status) {
      case "complete":
        complete++;
        break;
      case "partial":
        partial++;
        break;
      case "failed":
        failed++;
        break;
    }

    console.log(`  → Status: ${result.status}`);
    if (current < prospects.length) await sleep(DELAY_MS);
  }

  // Summary
  const withEmail = results.filter(r => r.ownerEmail).length;
  const verified = results.filter(r => r.ownerEmailStatus === "verified").length;

  console.log("\n--- Email Finder Summary ---");
  console.log(`Total:      ${prospects.length}`);
  console.log(`Complete:   ${complete}`);
  console.log(`Partial:    ${partial}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Emails:     ${withEmail} found, ${verified} verified`);
  console.log(tracker.summary());

  decaf();
  clearStatus();
}
