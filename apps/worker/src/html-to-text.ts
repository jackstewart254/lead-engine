/**
 * Aggressively strips HTML down to minimal clean text
 * to reduce token count before sending to OpenAI.
 */

const BLOCK_TAGS_TO_REMOVE = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "nav",
  "footer",
  "header",
];

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITY_MAP[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

export function htmlToText(html: string, maxChars = 6000): string {
  let text = html;

  // Remove block-level tags and their content entirely
  for (const tag of BLOCK_TAGS_TO_REMOVE) {
    const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    text = text.replace(re, " ");
  }

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Replace <br>, <p>, <div>, <li>, <tr> with newlines for readability
  text = text.replace(/<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6])[^>]*>/gi, "\n");

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = decodeEntities(text);

  // Collapse whitespace: multiple spaces/tabs to single space
  text = text.replace(/[^\S\n]+/g, " ");

  // Collapse multiple newlines to double newline
  text = text.replace(/\n\s*\n/g, "\n\n");

  // Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Truncate to limit
  if (text.length > maxChars) {
    text = text.slice(0, maxChars) + "\n[truncated]";
  }

  return text;
}
