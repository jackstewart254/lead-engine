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
