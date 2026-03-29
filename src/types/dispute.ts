export type DisputeStatus =
  | "OPEN"
  | "RESOLVED"
  | "ESCALATED";

export interface DisputeEvent {
  id: string;
  disputeId: string;
  type: "RAISED" | "ESCALATED" | "RESOLVED";
  createdAt: string;
  message?: string;
  actor?: string;
  actorRole?: string;
  sdkPauseConfirmed?: boolean;
  resolutionTxHash?: string;
}

export interface DisputeDetails {
  id: string;
  adoptionId: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
  events: DisputeEvent[];
}
