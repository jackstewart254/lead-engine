"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function SendCampaignButton({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    if (!confirm(`Send campaign "${campaignName}"?`)) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/worker/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    const data = await res.json();
    setResult(data.success ? "Sent!" : `Failed: ${data.output}`);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleSend}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </motion.button>
      {result && (
        <span className="text-xs text-muted">{result}</span>
      )}
    </div>
  );
}
