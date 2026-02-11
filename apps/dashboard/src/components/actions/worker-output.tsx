"use client";

import { motion, AnimatePresence } from "framer-motion";

export function WorkerOutput({
  output,
  success,
}: {
  output: string | null;
  success: boolean | null;
}) {
  return (
    <AnimatePresence>
      {output !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mt-4 overflow-hidden rounded-xl border border-border bg-card-bg shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <span
              className={`h-2 w-2 rounded-full ${success ? "bg-success" : "bg-danger"}`}
            />
            <span className="text-xs font-medium text-muted">
              {success ? "Completed" : "Failed"}
            </span>
          </div>
          <pre className="max-h-96 overflow-auto p-4 text-xs font-mono text-foreground/80">
            {output || "No output"}
          </pre>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
