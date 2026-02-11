"use client";

export function WorkerOutput({
  output,
  success,
}: {
  output: string | null;
  success: boolean | null;
}) {
  if (output === null) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card-bg">
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
    </div>
  );
}
