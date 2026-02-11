import { htmlToText } from "./html-to-text";

const SUBPAGES = [
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
  "/team",
  "/our-team",
];

const FETCH_TIMEOUT_MS = 10_000;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadEngine/1.0; +https://mcleanstewart.co.uk)",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    return await res.text();
  } catch {
    return null;
  }
}

function normalizeBaseUrl(website: string): string {
  let url = website.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  // Remove trailing slash
  return url.replace(/\/+$/, "");
}

export interface CrawlResult {
  url: string;
  text: string;
  pagesCrawled: number;
  totalChars: number;
}

export async function crawlWebsite(website: string): Promise<CrawlResult | null> {
  const base = normalizeBaseUrl(website);
  const sections: string[] = [];

  // Fetch homepage
  const homepage = await fetchPage(base);
  if (!homepage) return null;

  sections.push(`[Homepage]\n${htmlToText(homepage, 3000)}`);

  // Fetch subpages in parallel
  const subResults = await Promise.allSettled(
    SUBPAGES.map(async (path) => {
      const html = await fetchPage(`${base}${path}`);
      if (!html) return null;
      const text = htmlToText(html, 2000);
      // Skip if too short (likely 404 page) or duplicate of homepage
      if (text.length < 50) return null;
      return { path, text };
    })
  );

  for (const result of subResults) {
    if (result.status === "fulfilled" && result.value) {
      sections.push(`[${result.value.path}]\n${result.value.text}`);
    }
  }

  const combined = sections.join("\n\n");

  return {
    url: base,
    text: combined,
    pagesCrawled: sections.length,
    totalChars: combined.length,
  };
}
