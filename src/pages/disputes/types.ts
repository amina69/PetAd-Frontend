export interface EvidenceFile {
  id: string;
  fileName: string;
  url: string;
  sha256: string;
}

export interface DisputeDetail {
  id: string;
  raisedBy: {
    name: string;
    role: "ADOPTER" | "SHELTER" | "ADMIN";
  };
  reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  slaStatus: "ON_TIME" | "AT_RISK" | "BREACHED";
  escrow: {
    status: "LOCKED" | "RELEASED" | "REFUNDED";
    accountId: string;
  };
  evidence: EvidenceFile[];
}
