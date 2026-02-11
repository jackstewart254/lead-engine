import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getProspects } from "@/lib/queries";
import type { Prospect } from "@lead-engine/shared";

const columns: Column<Prospect>[] = [
  { header: "Business", accessor: "business_name" },
  { header: "Category", accessor: "category" },
  { header: "Location", accessor: "location" },
  {
    header: "Website",
    accessor: (row) =>
      row.website ? (
        <a
          href={row.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info underline"
        >
          {new URL(row.website).hostname}
        </a>
      ) : (
        "—"
      ),
  },
  {
    header: "Site Status",
    accessor: (row) => <StatusBadge status={row.website_status} />,
  },
  { header: "Owner", accessor: "owner_name" },
  {
    header: "Email",
    accessor: (row) => {
      const email = row.owner_email ?? row.general_email;
      if (!email) return "—";
      return (
        <span>
          {email}
          {!row.owner_email && row.general_email && (
            <span className="ml-1.5 text-xs text-muted">(general)</span>
          )}
        </span>
      );
    },
  },
  {
    header: "Source",
    accessor: (row) =>
      row.owner_source ? <StatusBadge status={row.owner_source} /> : "—",
  },
  { header: "Rating", accessor: "google_rating" },
];

export default async function ProspectsPage() {
  const prospects = await getProspects();

  return (
    <>
      <PageHeader
        title="Prospects"
        description={`${prospects.length} businesses found`}
      />
      {prospects.length === 0 ? (
        <EmptyState
          title="No prospects yet"
          description="Run a scrape from the Actions page to find businesses"
        />
      ) : (
        <DataTable columns={columns} data={prospects} />
      )}
    </>
  );
}
