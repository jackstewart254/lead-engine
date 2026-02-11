import OpenAI from "openai";
import { estimateTokens } from "./token-calculator";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI(); // reads OPENAI_API_KEY from env
  }
  return client;
}

export interface ExtractedContact {
  owner_name: string | null;
  owner_email: string | null;
  general_email: string | null;
  owner_source: "website" | null;
}

export interface ExtractionResult {
  contact: ExtractedContact;
  inputTokens: number;
  outputTokens: number;
}

const SYSTEM_PROMPT = `You extract business owner/director contact information from website text.
Return JSON only, no markdown. Schema:
{
  "owner_name": string | null,
  "owner_email": string | null,
  "general_email": string | null
}
Rules:
- owner_name: The name of the business owner, director, founder, or principal. Not a generic team member.
- owner_email: A personal/direct email for the owner if found (e.g. john@...). Not info@ or hello@.
- general_email: Any general contact email (info@, hello@, contact@, enquiries@).
- If you can't find a field, set it to null.
- Only extract what's clearly on the page. Never guess or fabricate.`;

export async function extractContacts(
  websiteText: string,
  businessName: string
): Promise<ExtractionResult> {
  const userPrompt = `Business: ${businessName}\n\nWebsite text:\n${websiteText}`;
  const inputTokens = estimateTokens(SYSTEM_PROMPT + userPrompt);

  const res = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = res.choices[0]?.message?.content ?? "{}";
  const outputTokens = estimateTokens(content);

  let parsed: Record<string, string | null>;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  return {
    contact: {
      owner_name: parsed.owner_name ?? null,
      owner_email: parsed.owner_email ?? null,
      general_email: parsed.general_email ?? null,
      owner_source: parsed.owner_email || parsed.owner_name ? "website" : null,
    },
    inputTokens: res.usage?.prompt_tokens ?? inputTokens,
    outputTokens: res.usage?.completion_tokens ?? outputTokens,
  };
}
