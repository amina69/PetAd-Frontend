import type {
  DisputeEscrowStatus,
  DisputeSlaStatus,
  DisputeStatusCode,
} from "../../types/dispute";

export interface EvidenceFile {
  id: string;
  fileName: string;
  url: string;
  sha256: string;
}

export type ResolutionType = "REFUND" | "RELEASE" | "SPLIT";

export interface ResolutionDistributionItem {
  recipient: string;
  amount: string;
  percentage: number;
}

export interface DisputeResolution {
  type: ResolutionType;
  adminNote: string;
  resolvedBy: string;
  resolvedAt: string;
  resolutionTxHash?: string;
  splitDistribution?: ResolutionDistributionItem[];
}

export interface DisputeDetail {
  id: string;
  raisedBy: {
    name: string;
    role: "ADOPTER" | "SHELTER" | "ADMIN";
  };
  reason: string;
  status: DisputeStatusCode;
  slaStatus: DisputeSlaStatus;
  escrow: {
    status: DisputeEscrowStatus;
    accountId: string;
  };
  evidence: EvidenceFile[];
  resolution?: DisputeResolution | null;
}
