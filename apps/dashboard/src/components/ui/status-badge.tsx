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
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}
