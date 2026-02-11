import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition } from "@/components/ui/animated";
import { getCampaigns } from "@/lib/queries";
import { CampaignForm } from "@/components/forms/campaign-form";
import { SendCampaignButton } from "@/components/actions/send-campaign-button";
import type { Campaign } from "@lead-engine/shared";

const columns: Column<Campaign>[] = [
  { header: "Name", accessor: "name" },
  { header: "Category", accessor: "target_category" },
  { header: "Location", accessor: "target_location" },
  {
    header: "Status",
    accessor: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Created",
    accessor: (row) => new Date(row.created_at).toLocaleDateString(),
  },
  {
    header: "Action",
    accessor: (row) => <SendCampaignButton campaignId={row.id} campaignName={row.name} />,
  },
];

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <PageTransition>
      <PageHeader
        title="Campaigns"
        description="Create and manage email campaigns"
      />
      <div className="mb-8">
        <CampaignForm />
      </div>
      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign above"
        />
      ) : (
        <DataTable columns={columns} data={campaigns} />
      )}
    </PageTransition>
  );
}
