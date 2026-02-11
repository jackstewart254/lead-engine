import { PageHeader } from "@/components/layout/page-header";
import { ScrapeForm } from "@/components/actions/scrape-form";
import { EnrichButton } from "@/components/actions/enrich-button";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/animated";
import { getUnenrichedCount } from "@/lib/queries";

export default async function ActionsPage() {
  const pendingCount = await getUnenrichedCount();

  return (
    <PageTransition>
      <PageHeader
        title="Actions"
        description="Manually trigger worker commands"
      />
      <StaggerContainer className="space-y-8">
        <StaggerItem>
          <ScrapeForm />
        </StaggerItem>
        <StaggerItem>
          <EnrichButton pendingCount={pendingCount} />
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
