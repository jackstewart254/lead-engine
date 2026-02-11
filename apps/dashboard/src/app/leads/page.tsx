import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/animated";
import { getLeads } from "@/lib/queries";
import type { Lead, Prospect } from "@lead-engine/shared";

type LeadRow = Lead & { prospect?: Prospect };

const statusOrder = ["hot", "warm", "converted", "lost"] as const;

export default async function LeadsPage() {
  const leads = await getLeads();

  const grouped = statusOrder.map((status) => ({
    status,
    leads: leads.filter((l) => l.status === status),
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads in pipeline`}
      />
      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Leads appear when prospects engage with your emails"
        />
      ) : (
        <StaggerContainer className="space-y-8">
          {grouped.map(
            (group) =>
              group.leads.length > 0 && (
                <StaggerItem key={group.status}>
                  <div className="mb-3 flex items-center gap-2">
                    <StatusBadge status={group.status} />
                    <span className="text-sm text-muted">
                      ({group.leads.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.leads.map((lead: LeadRow) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card-bg p-4 shadow-[var(--shadow-sm)]"
                      >
                        <div>
                          <p className="font-medium">
                            {lead.prospect?.business_name ?? "Unknown"}
                          </p>
                          <p className="text-sm text-muted">
                            {lead.prospect?.owner_email ?? "No email"}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          {lead.notes && (
                            <p className="text-muted">{lead.notes}</p>
                          )}
                          {lead.follow_up_date && (
                            <p className="text-info">
                              Follow up:{" "}
                              {new Date(lead.follow_up_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </StaggerItem>
              )
          )}
        </StaggerContainer>
      )}
    </PageTransition>
  );
}
