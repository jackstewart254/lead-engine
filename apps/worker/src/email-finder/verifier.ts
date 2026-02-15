export interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "accept_all" | "error";
  quality_score: number | null;
}

const VERIFIER_URL = process.env.EMAIL_VERIFIER_URL || "http://localhost:3001";
const VERIFIER_API_KEY = process.env.EMAIL_VERIFIER_API_KEY || "";
const DELAY_BETWEEN_CHECKS_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifySingle(email: string): Promise<VerificationResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (VERIFIER_API_KEY) {
      headers["Authorization"] = `Bearer ${VERIFIER_API_KEY}`;
    }

    const res = await fetch(`${VERIFIER_URL}/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      console.log(`     ⚠ Email verifier API error: ${res.status}`);
      return { email, status: "error", quality_score: null };
    }

    const data = (await res.json()) as VerificationResult;
    return data;
  } catch (err) {
    console.log(`     ⚠ Verification failed for ${email}: ${err}`);
    return { email, status: "error", quality_score: null };
  }
}

export async function verifyEmails(emails: string[]): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  for (let i = 0; i < emails.length; i++) {
    const result = await verifySingle(emails[i]);
    results.push(result);
    if (i < emails.length - 1) await sleep(DELAY_BETWEEN_CHECKS_MS);
  }

  return results;
}

export interface TieredVerificationResult {
  best: VerificationResult | null;
  all: VerificationResult[];
  creditsUsed: number;
  tierReached: number;
}

/**
 * Verify emails tier by tier with early termination.
 * Stops immediately on a "valid" result.
 * On "accept_all", saves as fallback and continues one more tier.
 */
export async function verifyEmailsTiered(
  tiers: { tier: number; emails: string[] }[]
): Promise<TieredVerificationResult> {
  const result: TieredVerificationResult = {
    best: null,
    all: [],
    creditsUsed: 0,
    tierReached: 0,
  };

  let acceptAllFallback: VerificationResult | null = null;
  let acceptAllTier = -1;

  for (const { tier, emails } of tiers) {
    result.tierReached = tier;
    console.log(`     Tier ${tier}: checking ${emails.join(", ")}`);

    for (let i = 0; i < emails.length; i++) {
      const v = await verifySingle(emails[i]);
      result.all.push(v);
      result.creditsUsed++;

      console.log(
        `     ${v.status === "valid" ? "✓" : v.status === "invalid" ? "✗" : "~"} ${v.email} → ${v.status}${v.quality_score !== null ? ` (quality: ${v.quality_score})` : ""}`
      );

      if (v.status === "valid") {
        result.best = v;
        console.log(`     → Hit at tier ${tier}, ${result.creditsUsed} credits used`);
        return result;
      }

      if (v.status === "accept_all" && !acceptAllFallback) {
        acceptAllFallback = v;
        acceptAllTier = tier;
      }

      if (i < emails.length - 1) await sleep(DELAY_BETWEEN_CHECKS_MS);
    }

    if (acceptAllFallback && tier > acceptAllTier) {
      result.best = acceptAllFallback;
      console.log(`     → Accept-all fallback from tier ${acceptAllTier}, ${result.creditsUsed} credits used`);
      return result;
    }
  }

  result.best = acceptAllFallback;
  if (result.best) {
    console.log(`     → Accept-all fallback, ${result.creditsUsed} credits used`);
  } else {
    console.log(`     → No valid candidates, ${result.creditsUsed} credits used`);
  }

  return result;
}
