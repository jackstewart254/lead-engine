import { AnimatedCard } from "@/components/ui/animated";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <AnimatedCard className="rounded-xl border border-border bg-card-bg p-6 shadow-[var(--shadow-md)]">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </AnimatedCard>
  );
}
