import * as dns from "dns";
import * as net from "net";
import * as crypto from "crypto";

export interface SmtpVerificationResult {
  email: string;
  status: "valid" | "invalid" | "accept_all" | "error";
  quality_score: number | null;
}

const EHLO_DOMAIN = process.env.EHLO_DOMAIN || "leadengine.co.uk";
const MAIL_FROM = process.env.MAIL_FROM || `verify@${EHLO_DOMAIN}`;
const SMTP_TIMEOUT_MS = parseInt(process.env.SMTP_TIMEOUT_MS || "10000", 10);
const DOMAIN_COOLDOWN_MS = parseInt(process.env.DOMAIN_COOLDOWN_MS || "2000", 10);
const GREYLIST_RETRY_MS = parseInt(process.env.GREYLIST_RETRY_MS || "5000", 10);

// Caches (1hr TTL)
const mxCache = new Map<string, { records: dns.MxRecord[]; expires: number }>();
const catchAllCache = new Map<string, { isCatchAll: boolean; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Per-domain rate limiting — prevents hammering the same mail server
const domainLastProbe = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDomainCooldown(domain: string): Promise<void> {
  const last = domainLastProbe.get(domain);
  if (last) {
    const elapsed = Date.now() - last;
    if (elapsed < DOMAIN_COOLDOWN_MS) {
      await sleep(DOMAIN_COOLDOWN_MS - elapsed);
    }
  }
  domainLastProbe.set(domain, Date.now());
}

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

      // SMTP multiline responses: "250-text" = continuation, "250 text" = final line.
      // Only process once we have the final line (char after 3-digit code is space, not dash).
      if (lastLine.length >= 4 && lastLine[3] === "-") return;

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
            socket.write(`MAIL FROM:<${MAIL_FROM}>\r\n`);
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

  // Use an obviously fake address to detect catch-all
  const random = crypto.randomBytes(8).toString("hex");
  const probeEmail = `xyzcheck-${random}@${domain}`;
  await waitForDomainCooldown(domain);
  const { code } = await smtpProbe(mxHost, probeEmail);
  const result = code >= 200 && code < 300;

  catchAllCache.set(domain, { isCatchAll: result, expires: Date.now() + CACHE_TTL_MS });
  return result;
}

/** Classify an SMTP response code + message into a verification status */
function classifyResponse(code: number, message: string): SmtpVerificationResult["status"] {
  if (code >= 200 && code < 300) return "valid";
  if (code >= 500 && code < 600) return "invalid";

  // 4xx or other — check for permanent rejection language
  const msg = message.toLowerCase();
  if (
    msg.includes("does not exist") ||
    msg.includes("no such user") ||
    msg.includes("invalid address") ||
    msg.includes("user unknown") ||
    msg.includes("recipient rejected") ||
    msg.includes("mailbox not found") ||
    msg.includes("address rejected") ||
    msg.includes("undeliverable") ||
    msg.includes("permanent") ||
    msg.includes("unknown user") ||
    msg.includes("not exist")
  ) {
    return "invalid";
  }

  return "error";
}

/** Check if a 4xx response indicates greylisting (temporary rejection, retry later) */
function isGreylisting(code: number, message: string): boolean {
  if (code < 400 || code >= 500) return false;
  const msg = message.toLowerCase();
  return (
    msg.includes("try again") ||
    msg.includes("try later") ||
    msg.includes("greylisted") ||
    msg.includes("greylist") ||
    msg.includes("temporarily") ||
    msg.includes("come back") ||
    msg.includes("please retry") ||
    code === 450 ||
    code === 451
  );
}

function scoreFromStatus(status: SmtpVerificationResult["status"]): number | null {
  if (status === "valid") return 1;
  if (status === "invalid") return 0;
  if (status === "accept_all") return 0.5;
  return null;
}

export async function verifyEmail(email: string): Promise<SmtpVerificationResult> {
  const domain = email.split("@")[1];
  if (!domain) return { email, status: "invalid", quality_score: 0 };

  const mxRecords = await resolveMx(domain);
  if (mxRecords.length === 0) return { email, status: "invalid", quality_score: 0 };

  // Catch-all detection (use primary MX, result is cached per domain)
  const primaryMx = mxRecords[0].exchange;
  try {
    const catchAll = await isCatchAll(domain, primaryMx);
    if (catchAll) return { email, status: "accept_all", quality_score: 0.5 };
  } catch {
    // Continue with direct probe
  }

  // Try MX records in priority order — fall back to secondary on connection failures
  const mxToTry = mxRecords.slice(0, 3);
  for (const mx of mxToTry) {
    const mxHost = mx.exchange;
    await waitForDomainCooldown(domain);
    const { code, message } = await smtpProbe(mxHost, email);

    // Connection-level failure (timeout, refused, etc.) — try next MX
    if (code === -1) continue;

    // Greylisting: 4xx temporary rejection — wait and retry once
    if (isGreylisting(code, message)) {
      await sleep(GREYLIST_RETRY_MS);
      await waitForDomainCooldown(domain);
      const retry = await smtpProbe(mxHost, email);
      if (retry.code !== -1) {
        const status = classifyResponse(retry.code, retry.message);
        return { email, status, quality_score: scoreFromStatus(status) };
      }
      continue;
    }

    // Got a definitive response
    const status = classifyResponse(code, message);
    return { email, status, quality_score: scoreFromStatus(status) };
  }

  // All MX records failed — retry primary once with backoff
  await sleep(2000);
  await waitForDomainCooldown(domain);
  const { code, message } = await smtpProbe(primaryMx, email);
  if (code !== -1) {
    const status = classifyResponse(code, message);
    return { email, status, quality_score: scoreFromStatus(status) };
  }

  return { email, status: "error", quality_score: null };
}
