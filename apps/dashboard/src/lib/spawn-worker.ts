import { execFile } from "child_process";
import path from "path";

export function spawnWorker(
  args: string[]
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const cwd = path.resolve(process.cwd(), "../..");
    execFile(
      "npx",
      ["tsx", "apps/worker/src/index.ts", ...args],
      { cwd, timeout: 300_000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = [stdout, stderr].filter(Boolean).join("\n");
        resolve({ success: !error, output });
      }
    );
  });
}
