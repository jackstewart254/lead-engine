/**
 * Token estimation and cost tracking for OpenAI API calls.
 * Uses ~4 chars/token heuristic (accurate within ~10% for English text).
 */

// Pricing per 1M tokens (USD) — update as OpenAI changes pricing
const MODELS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
};

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = MODELS[model];
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

export class CostTracker {
  private model: string;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private callCount = 0;

  constructor(model: string) {
    this.model = model;
  }

  /** Log a completed API call */
  addCall(inputTokens: number, outputTokens: number) {
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.callCount++;
  }

  /** Estimate cost before making a call */
  previewCost(inputText: string, estimatedOutputTokens = 200): string {
    const inputTokens = estimateTokens(inputText);
    const cost = estimateCost(inputTokens, estimatedOutputTokens, this.model);
    return `~${inputTokens.toLocaleString()} input tokens → ~$${cost.toFixed(5)}`;
  }

  /** Print running total */
  summary(): string {
    const cost = estimateCost(
      this.totalInputTokens,
      this.totalOutputTokens,
      this.model
    );
    return [
      `\n--- OpenAI Cost Summary (${this.model}) ---`,
      `Calls:         ${this.callCount}`,
      `Input tokens:  ${this.totalInputTokens.toLocaleString()}`,
      `Output tokens: ${this.totalOutputTokens.toLocaleString()}`,
      `Est. cost:     $${cost.toFixed(4)}`,
      `-------------------------------------------`,
    ].join("\n");
  }
}
