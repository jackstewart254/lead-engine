"use client";

import { motion } from "framer-motion";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
    >
      <p className="text-lg font-medium text-muted">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted/70">{description}</p>
      )}
    </motion.div>
  );
}
