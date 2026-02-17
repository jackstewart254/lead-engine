import { spawn } from "child_process";
import path from "path";

type PageType = "homepage" | "team" | "about" | "contact" | "other";

export interface PageResult {
  path: string;
  html: string;
  text: string;
  type: PageType;
}

export interface CrawlResult {
  url: string;
  text: string;
  pages: PageResult[];
  pagesCrawled: number;
  totalChars: number;
}

const SUBPROCESS_TIMEOUT_MS = 120_000;

export async function crawlWebsite(
  website: string
): Promise<CrawlResult | null> {
  const scriptPath = path.resolve(__dirname, "..", "crawl.py");

  return new Promise((resolve) => {
    const proc = spawn("python3", [scriptPath, website], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: SUBPROCESS_TIMEOUT_MS,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      console.error(`crawl.py spawn error: ${err.message}`);
      resolve(null);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`crawl.py exited with code ${code}: ${stderr}`);
        resolve(null);
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result as CrawlResult);
      } catch (err) {
        console.error(`crawl.py JSON parse error: ${err}`);
        resolve(null);
      }
    });
  });
}
