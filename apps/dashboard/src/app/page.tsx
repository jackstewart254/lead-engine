import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getStats } from "@/lib/queries";

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Lead generation pipeline at a glance"
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Prospects"
          value={stats.totalProspects}
          sub="From Google Places"
        />
        <StatCard
          label="Enriched"
          value={stats.enriched}
          sub="With owner email found"
        />
        <StatCard
          label="Emails Sent"
          value={stats.emailsSent}
          sub="Across all campaigns"
        />
        <StatCard
          label="Leads"
          value={stats.totalLeads}
          sub="Warm, hot, or converted"
        />
      </div>
    </>
  );
}
