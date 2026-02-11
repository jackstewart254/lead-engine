export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
}: {
  columns: Column<T>[];
  data: T[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-[var(--shadow-md)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id}
              className="animate-row-in border-b border-border bg-card-bg transition-colors hover:bg-background/70"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {columns.map((col) => (
                <td key={col.header} className={`px-5 py-3.5 ${col.className ?? ""}`}>
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode) ?? "\u2014"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
