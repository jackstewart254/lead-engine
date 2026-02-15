import * as dns from "dns";
import * as net from "net";
import * as crypto from "crypto";

export interface SmtpVerificationResult {
  email: string;
  status: "valid" | "invalid" | "accept_all" | "error";
  quality_score: number | null;
}

const EHLO_DOMAIN = process.env.EHLO_DOMAIN || "leadengine.co.uk";
const SMTP_TIMEOUT_MS = parseInt(process.env.SMTP_TIMEOUT_MS || "10000", 10);

// Caches (1hr TTL)
const mxCache = new Map<string, { records: dns.MxRecord[]; expires: number }>();
const catchAllCache = new Map<string, { isCatchAll: boolean; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function resolveMx(domain: string): Promise<dns.MxRecord[]> {
  const cached = mxCache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.records;

  try {
    const records = await dns.promises.resolveMx(domain);
    records.sort((a, b) => a.priority - b.priority);
    mxCache.set(domain, { records, expires: Date.now() + CACHE_TTL_MS });
    return records;
  } catch {
    mxCache.set(domain, { records: [], expires: Date.now() + CACHE_TTL_MS });
    return [];
  }
}

function smtpProbe(mxHost: string, recipientEmail: string): Promise<{ code: number; message: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let step = 0;
    let resolved = false;

    const done = (code: number, message = "") => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ code, message });
    };

    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.on("timeout", () => done(-1, "timeout"));
    socket.on("error", (err) => done(-1, err.message));

    let buffer = "";

    socket.on("data", (data) => {
      buffer += data.toString();

      if (!buffer.endsWith("\r\n")) return;

      const lines = buffer.trim().split("\r\n");
      const lastLine = lines[lines.length - 1];
      const code = parseInt(lastLine.substring(0, 3), 10);
      const msg = lastLine.substring(4);
      buffer = "";

      if (isNaN(code)) {
        done(-1, "invalid response");
        return;
      }

      switch (step) {
        case 0: // Server greeting
          if (code >= 200 && code < 300) {
            step = 1;
            socket.write(`EHLO ${EHLO_DOMAIN}\r\n`);
          } else {
            done(code, msg);
          }
          break;
        case 1: // EHLO response
          if (code >= 200 && code < 300) {
            step = 2;
            socket.write(`MAIL FROM:<verify@${EHLO_DOMAIN}>\r\n`);
          } else {
            done(code, msg);
          }
          break;
        case 2: // MAIL FROM response
          if (code >= 200 && code < 300) {
            step = 3;
            socket.write(`RCPT TO:<${recipientEmail}>\r\n`);
          } else {
            done(code, msg);
          }
          break;
        case 3: // RCPT TO response
          socket.write("QUIT\r\n");
          done(code, msg);
          break;
      }
    });

    socket.connect(25, mxHost);
  });
}

async function isCatchAll(domain: string, mxHost: string): Promise<boolean> {
  const cached = catchAllCache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.isCatchAll;

  const random = crypto.randomBytes(8).toString("hex");
  const probeEmail = `test-${random}@${domain}`;
  const { code } = await smtpProbe(mxHost, probeEmail);
  const result = code >= 200 && code < 300;

  catchAllCache.set(domain, { isCatchAll: result, expires: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function verifyEmail(email: string): Promise<SmtpVerificationResult> {
  const domain = email.split("@")[1];
  if (!domain) {
    return { email, status: "invalid", quality_score: 0 };
  }

  const mxRecords = await resolveMx(domain);
  if (mxRecords.length === 0) {
    return { email, status: "invalid", quality_score: 0 };
  }

  const mxHost = mxRecords[0].exchange;

  // Catch-all detection
  try {
    const catchAll = await isCatchAll(domain, mxHost);
    if (catchAll) {
      return { email, status: "accept_all", quality_score: 0.5 };
    }
  } catch {
    // Continue with direct probe
  }

  // Direct SMTP probe
  try {
    const { code, message } = await smtpProbe(mxHost, email);

    if (code >= 200 && code < 300) {
      return { email, status: "valid", quality_score: 1 };
    } else if (code >= 500 && code < 600) {
      return { email, status: "invalid", quality_score: 0 };
    } else if (code === -1 && message === "timeout") {
      return { email, status: "error", quality_score: null };
    } else {
      // 4xx or other — check for permanent rejection language
      const msg = message.toLowerCase();
      if (msg.includes("permanent") || msg.includes("invalid address") || msg.includes("does not exist") || msg.includes("no such user")) {
        return { email, status: "invalid", quality_score: 0 };
      }
      return { email, status: "error", quality_score: null };
    }
  } catch {
    return { email, status: "error", quality_score: null };
  }
}
