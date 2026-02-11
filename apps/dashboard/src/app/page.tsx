import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/animated";
import { getStats } from "@/lib/queries";

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <PageTransition>
      <PageHeader
        title="Overview"
        description="Lead generation pipeline at a glance"
      />
      <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Total Prospects"
            value={stats.totalProspects}
            sub="From Google Places"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Enriched"
            value={stats.enriched}
            sub="With owner email found"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Emails Sent"
            value={stats.emailsSent}
            sub="Across all campaigns"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Leads"
            value={stats.totalLeads}
            sub="Warm, hot, or converted"
          />
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
