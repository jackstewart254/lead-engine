"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  const pct = status ? Math.round((status.current / status.total) * 100) : 0;

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-0 left-56 right-0 z-50 border-t border-border bg-card-bg px-6 py-3 shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-center gap-4">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-info"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
