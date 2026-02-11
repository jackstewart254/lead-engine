"use client";

import { motion } from "framer-motion";

const colorMap: Record<string, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-muted/10 text-muted",
  paused: "bg-warning/10 text-warning",
  completed: "bg-info/10 text-info",
  warm: "bg-warning/10 text-warning",
  hot: "bg-danger/10 text-danger",
  converted: "bg-success/10 text-success",
  lost: "bg-muted/10 text-muted",
  none: "bg-muted/10 text-muted",
  outdated: "bg-warning/10 text-warning",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = colorMap[status] ?? "bg-muted/10 text-muted";
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {status}
    </motion.span>
  );
}
