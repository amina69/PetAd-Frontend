export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";

export interface DisputeActor {
	id: string;
	name: string;
	role: "ADOPTER" | "OWNER" | "ADMIN" | "MODERATOR";
}

export interface DisputeEvidenceFile {
	id: string;
	fileName: string;
	downloadUrl: string;
	sha256: string;
	mimeType: string;
	submittedBy: DisputeActor;
	submittedAt: string;
}

export interface DisputeEscrowSummary {
	escrowId: string;
	accountId: string;
	onChainStatus:
		| "AWAITING_FUNDS"
		| "FUNDED"
		| "IN_REVIEW"
		| "DISPUTED"
		| "SETTLED"
		| "SETTLEMENT_FAILED";
}

export interface DisputeTimelineEvent {
	event: string;
	actor: string;
	timestamp: string;
}

export interface DisputeDetails {
	id: string;
	adoptionId: string;
	raisedBy: DisputeActor;
	reason: string;
	description: string;
	status: DisputeStatus;
	slaDeadlineAt: string;
	escrow: DisputeEscrowSummary;
	evidence: DisputeEvidenceFile[];
	timeline: DisputeTimelineEvent[];
	resolution: string | null;
	createdAt: string;
	updatedAt: string;
}