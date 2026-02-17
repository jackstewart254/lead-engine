import { spawn } from "child_process";

/**
 * Prevents macOS from sleeping (display + idle + system).
 * Returns a cleanup function that kills the caffeinate process.
 */
export function caffeinate(): () => void {
  const proc = spawn("caffeinate", ["-dis"], {
    stdio: "ignore",
    detached: false,
  });

  proc.on("error", () => {
    // caffeinate not available (non-macOS) — silently ignore
  });

  return () => {
    proc.kill();
  };
}
