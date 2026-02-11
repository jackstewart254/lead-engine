import { PageHeader } from "@/components/layout/page-header";
import { ScrapeForm } from "@/components/actions/scrape-form";
import { EnrichButton } from "@/components/actions/enrich-button";
import { getUnenrichedCount } from "@/lib/queries";

export default async function ActionsPage() {
  const pendingCount = await getUnenrichedCount();

  return (
    <>
      <PageHeader
        title="Actions"
        description="Manually trigger worker commands"
      />
      <div className="space-y-8">
        <ScrapeForm />
        <EnrichButton pendingCount={pendingCount} />
      </div>
    </>
  );
}
