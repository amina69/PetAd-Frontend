import type { StatusBadgeColor } from "../../components/ui/StatusBadge";

export type DocumentVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface DocumentStatusConfig {
  label: string;
  description: string;
  color: StatusBadgeColor;
}

export const statusConfig: Record<DocumentVerificationStatus, DocumentStatusConfig> = {
  PENDING: {
    label: "Pending",
    description: "Waiting for out-of-band verification.",
    color: "amber",
  },
  VERIFIED: {
    label: "Verified",
    description: "Document passed verification.",
    color: "green",
  },
  REJECTED: {
    label: "Rejected",
    description: "Document was rejected and must be replaced.",
    color: "red",
  },
  EXPIRED: {
    label: "Expired",
    description: "Document is past its expiry date.",
    color: "gray",
  },
};

export interface WorkflowDocumentRequirement {
  kind: string;
  label: string;
  required: boolean;
}

export const WORKFLOW_DOCUMENT_CHECKLIST: WorkflowDocumentRequirement[] = [
  { kind: "ID", label: "Photo ID", required: true },
  { kind: "VACCINATION", label: "Vaccination record", required: true },
  { kind: "VET_REPORT", label: "Vet health report", required: true },
  { kind: "PROOF_OF_ADDRESS", label: "Proof of address", required: false },
];
