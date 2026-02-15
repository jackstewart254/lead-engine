#!/bin/bash
# Run on a fresh Ubuntu VPS: curl -sL <url> | bash
# Or paste directly into SSH session

set -e

API_KEY="${API_KEY:-$(openssl rand -hex 16)}"
EHLO_DOMAIN="${EHLO_DOMAIN:-leadengine.co.uk}"
PORT="${PORT:-3001}"

echo "==> Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Creating app directory..."
sudo mkdir -p /opt/email-verifier
sudo chown $USER:$USER /opt/email-verifier
cd /opt/email-verifier

echo "==> Writing package.json..."
cat > package.json << 'PKGJSON'
{
  "name": "email-verifier",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "npx tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
PKGJSON

echo "==> Writing tsconfig.json..."
cat > tsconfig.json << 'TSCONF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
TSCONF

mkdir -p src

echo "==> Writing source files..."
cat > src/smtp-verify.ts << 'SMTPVERIFY'
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

      if (isNaN(code)) { done(-1, "invalid response"); return; }

      switch (step) {
        case 0:
          if (code >= 200 && code < 300) { step = 1; socket.write(`EHLO ${EHLO_DOMAIN}\r\n`); }
          else { done(code, msg); }
          break;
        case 1:
          if (code >= 200 && code < 300) { step = 2; socket.write(`MAIL FROM:<verify@${EHLO_DOMAIN}>\r\n`); }
          else { done(code, msg); }
          break;
        case 2:
          if (code >= 200 && code < 300) { step = 3; socket.write(`RCPT TO:<${recipientEmail}>\r\n`); }
          else { done(code, msg); }
          break;
        case 3:
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
  if (!domain) return { email, status: "invalid", quality_score: 0 };

  const mxRecords = await resolveMx(domain);
  if (mxRecords.length === 0) return { email, status: "invalid", quality_score: 0 };

  const mxHost = mxRecords[0].exchange;

  try {
    const catchAll = await isCatchAll(domain, mxHost);
    if (catchAll) return { email, status: "accept_all", quality_score: 0.5 };
  } catch {}

  try {
    const { code, message } = await smtpProbe(mxHost, email);

    if (code >= 200 && code < 300) return { email, status: "valid", quality_score: 1 };
    if (code >= 500 && code < 600) return { email, status: "invalid", quality_score: 0 };
    if (code === -1 && message === "timeout") return { email, status: "error", quality_score: null };

    const msg = message.toLowerCase();
    if (msg.includes("permanent") || msg.includes("invalid address") || msg.includes("does not exist") || msg.includes("no such user")) {
      return { email, status: "invalid", quality_score: 0 };
    }
    return { email, status: "error", quality_score: null };
  } catch {
    return { email, status: "error", quality_score: null };
  }
}
SMTPVERIFY

cat > src/index.ts << 'INDEX'
import express from "express";
import { verifyEmail, SmtpVerificationResult } from "./smtp-verify";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3001", 10);
const API_KEY = process.env.API_KEY || "";
const DELAY_BETWEEN_CHECKS_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.use((req, res, next) => {
  if (!API_KEY) return next();
  if (req.path === "/health") return next();

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${API_KEY}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/verify", async (req, res) => {
  const { email, emails } = req.body as { email?: string; emails?: string[] };

  if (email && !emails) {
    const result = await verifyEmail(email);
    res.json(result);
    return;
  }

  if (emails && Array.isArray(emails)) {
    if (emails.length > 50) {
      res.status(400).json({ error: "Maximum 50 emails per batch" });
      return;
    }

    const results: SmtpVerificationResult[] = [];
    for (let i = 0; i < emails.length; i++) {
      const result = await verifyEmail(emails[i]);
      results.push(result);
      if (i < emails.length - 1) await sleep(DELAY_BETWEEN_CHECKS_MS);
    }
    res.json({ results });
    return;
  }

  res.status(400).json({ error: "Provide 'email' (string) or 'emails' (string[])" });
});

app.listen(PORT, () => {
  console.log(`Email verifier running on :${PORT}`);
});
INDEX

echo "==> Installing dependencies..."
npm install

echo "==> Building..."
npm run build

echo "==> Creating systemd service..."
sudo tee /etc/systemd/system/email-verifier.service > /dev/null << SYSTEMD
[Unit]
Description=Email Verifier
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/email-verifier
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=PORT=$PORT
Environment=API_KEY=$API_KEY
Environment=EHLO_DOMAIN=$EHLO_DOMAIN

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable email-verifier
sudo systemctl start email-verifier

echo ""
echo "============================================"
echo "  Email verifier is running on port $PORT"
echo "  API_KEY: $API_KEY"
echo "============================================"
echo ""
echo "Add to your .env:"
echo "  EMAIL_VERIFIER_URL=http://$(curl -s ifconfig.me):$PORT"
echo "  EMAIL_VERIFIER_API_KEY=$API_KEY"
echo ""
echo "Test:"
echo "  curl -X POST http://localhost:$PORT/verify \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer $API_KEY' \\"
echo "    -d '{\"email\":\"test@gmail.com\"}'"
