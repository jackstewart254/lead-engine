"use client";

import { useState } from "react";
import { WorkerOutput } from "./worker-output";

export function EnrichButton({ pendingCount }: { pendingCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    output: string;
  } | null>(null);

  async function handleEnrich() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/worker/enrich", { method: "POST" });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-card-bg p-6">
        <h2 className="mb-2 text-lg font-semibold">Enrich Prospects</h2>
        <p className="mb-4 text-sm text-muted">
          {pendingCount} prospect{pendingCount !== 1 ? "s" : ""} awaiting enrichment
        </p>
        <button
          onClick={handleEnrich}
          disabled={loading || pendingCount === 0}
          className="rounded-lg bg-info px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-info/90 disabled:opacity-50"
        >
          {loading ? "Enriching..." : "Run Enrichment"}
        </button>
      </div>
      <WorkerOutput output={result?.output ?? null} success={result?.success ?? null} />
    </div>
  );
}
