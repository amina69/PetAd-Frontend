export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

/**
 * Token map for shared status badges. Domains correspond to the adoption,
 * custody, dispute, and document journeys.
 */
export const statusConfig = {
  approval: {
    APPROVED: { label: "Approved", tone: "success" },
    REJECTED: { label: "Rejected", tone: "danger" },
    EXPIRED: { label: "Expired", tone: "neutral" },
  },
  adoption: {
    pending: { label: "Pending", tone: "warning" },
    active: { label: "Active", tone: "success" },
    completed: { label: "Completed", tone: "info" },
  },
  custody: {
    requested: { label: "Requested", tone: "warning" },
    approved: { label: "Approved", tone: "success" },
    active: { label: "Active", tone: "info" },
  },
  dispute: {
    filed: { label: "Filed", tone: "warning" },
    resolved: { label: "Resolved", tone: "success" },
  },
  document: {
    uploaded: { label: "Uploaded", tone: "info" },
    verified: { label: "Verified", tone: "success" },
    rejected: { label: "Rejected", tone: "danger" },
  },
} as const satisfies Record<string, Record<string, StatusPresentation>>;

export type StatusDomain = keyof typeof statusConfig;

export function presentationFor(domain: StatusDomain, status: string): StatusPresentation {
  const domainConfig = statusConfig[domain] as Record<string, StatusPresentation>;
  return domainConfig[status] ?? { label: status, tone: "neutral" };
}
