import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition } from "@/components/ui/animated";
import { getEmailsSent } from "@/lib/queries";
import type { EmailSent, Prospect } from "@lead-engine/shared";

type EmailRow = EmailSent & { prospect?: Prospect };

const columns: Column<EmailRow>[] = [
  {
    header: "Recipient",
    accessor: (row) => row.prospect?.business_name ?? "Unknown",
  },
  { header: "Subject", accessor: "subject" },
  {
    header: "Sent",
    accessor: (row) => new Date(row.sent_at).toLocaleDateString(),
  },
  {
    header: "Opened",
    accessor: (row) => (
      <span className={row.opened ? "text-success font-medium" : "text-muted"}>
        {row.opened ? `Yes (${row.open_count})` : "No"}
      </span>
    ),
  },
  {
    header: "Clicked",
    accessor: (row) => (
      <span className={row.clicked ? "text-success font-medium" : "text-muted"}>
        {row.clicked ? "Yes" : "No"}
      </span>
    ),
  },
  {
    header: "Replied",
    accessor: (row) => (
      <span className={row.replied ? "text-success font-medium" : "text-muted"}>
        {row.replied ? "Yes" : "No"}
      </span>
    ),
  },
  {
    header: "Bounced",
    accessor: (row) => (
      <span className={row.bounced ? "text-danger font-medium" : "text-muted"}>
        {row.bounced ? "Yes" : "No"}
      </span>
    ),
  },
  {
    header: "Follow-up",
    accessor: (row) => (row.follow_up_number > 0 ? `#${row.follow_up_number}` : "Initial"),
  },
];

export default async function EmailsPage() {
  const emails = await getEmailsSent();

  return (
    <PageTransition>
      <PageHeader
        title="Emails Sent"
        description={`${emails.length} emails tracked`}
      />
      {emails.length === 0 ? (
        <EmptyState
          title="No emails sent yet"
          description="Create a campaign and send it to start tracking"
        />
      ) : (
        <DataTable columns={columns} data={emails} />
      )}
    </PageTransition>
  );
}
