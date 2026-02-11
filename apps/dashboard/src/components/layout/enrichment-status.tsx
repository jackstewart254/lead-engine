"use client";

import { useEffect, useState } from "react";

interface EnrichStatus {
  running: boolean;
  current: number;
  total: number;
  businessName: string;
  enriched: number;
  failed: number;
  skipped: number;
}

export function EnrichmentStatus() {
  const [status, setStatus] = useState<EnrichStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/worker/enrich/status");
        const data = await res.json();
        if (active) setStatus(data.running ? data : null);
      } catch {
        if (active) setStatus(null);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!status) return null;

  const pct = Math.round((status.current / status.total) * 100);

  return (
    <div className="fixed bottom-0 left-56 right-0 z-50 border-t border-border bg-card-bg px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-info transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-info" />
          <span className="font-medium">
            Enriching {status.current}/{status.total}
          </span>
          <span className="text-muted">—</span>
          <span className="text-muted">{status.businessName}</span>
        </div>
      </div>
    </div>
  );
}
