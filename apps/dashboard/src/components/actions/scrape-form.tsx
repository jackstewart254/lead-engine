"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WorkerOutput } from "./worker-output";

export function ScrapeForm() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    output: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/worker/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, location }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card-bg p-6 shadow-[var(--shadow-md)]">
        <h2 className="mb-4 text-lg font-semibold">Scrape Google Places</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. dentists"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Glasgow"
            />
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="mt-4 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-info/90 disabled:opacity-50"
        >
          {loading ? "Scraping..." : "Run Scrape"}
        </motion.button>
      </form>
      <WorkerOutput output={result?.output ?? null} success={result?.success ?? null} />
    </div>
  );
}
