import { http, HttpResponse, delay } from "msw";
import type { Dispute, DisputeListResponse } from "../../types/dispute";

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
	{
		id: "dispute-001",
		adoptionId: "adoption-002",
		raisedBy: "user-buyer-2",
		reason: "misrepresentation",
		description: "Pet's health condition was not accurately described in the listing.",
		status: "open",
		isOverdue: true,
		pet: { id: "pet-1", name: "Max" },
		adopter: { id: "user-buyer-2", name: "Alice Smith" },
		shelter: { id: "user-shelter-1", name: "Happy Paws Shelter" },
		evidence: [
			{
				id: "ev-001",
				type: "document",
				url: "/mock-files/vet-report-ev001.pdf",
				submittedBy: "user-buyer-2",
				submittedAt: "2026-03-23T11:00:00.000Z",
			},
		],
		timeline: [
			{
				event: "Dispute raised",
				actor: "user-buyer-2",
				timestamp: "2026-03-23T10:45:00.000Z",
			},
			{
				event: "Evidence submitted",
				actor: "user-buyer-2",
				timestamp: "2026-03-23T11:00:00.000Z",
			},
			{
				event: "SLA breach detected",
				actor: "system",
				timestamp: "2026-03-25T10:45:00.000Z",
			},
		],
		resolution: null,
		createdAt: "2026-03-23T10:45:00.000Z",
		updatedAt: "2026-03-25T10:45:00.000Z",
	},
	{
		id: "dispute-002",
		adoptionId: "adoption-004",
		raisedBy: "user-buyer-6",
		reason: "delayed_handover",
		description: "Shelter did not physically hand over the pet at the agreed time.",
		status: "under_review",
		isOverdue: false,
		pet: { id: "pet-2", name: "Bella" },
		adopter: { id: "user-buyer-6", name: "Bob Johnson" },
		shelter: { id: "user-shelter-2", name: "Rescue Dogs" },
		evidence: [
			{
				id: "ev-002",
				type: "photo",
				url: "/mock-files/handover-chat.png",
				submittedBy: "user-buyer-6",
				submittedAt: "2026-03-26T12:00:00.000Z",
			},
		],
		timeline: [
			{
				event: "Dispute raised",
				actor: "user-buyer-6",
				timestamp: "2026-03-26T10:45:00.000Z",
			},
			{
				event: "Evidence submitted",
				actor: "user-buyer-6",
				timestamp: "2026-03-26T12:00:00.000Z",
			},
			{
				event: "Status changed to Under Review",
				actor: "admin-1",
				timestamp: "2026-03-27T09:00:00.000Z",
			},
		],
		resolution: null,
		createdAt: "2026-03-26T10:45:00.000Z",
		updatedAt: "2026-03-27T09:00:00.000Z",
	},
	{
		id: "dispute-003",
		adoptionId: "adoption-005",
		raisedBy: "user-buyer-1",
		reason: "other",
		description: "Unspecified issues during escrow period.",
		status: "resolved",
		isOverdue: false,
		pet: { id: "pet-3", name: "Charlie" },
		adopter: { id: "user-buyer-1", name: "Eve Williams" },
		shelter: { id: "user-shelter-3", name: "Safe Haven" },
		evidence: [
			{
				id: "ev-003a",
				type: "document",
				url: "/mock-files/statement-ev003a.pdf",
				submittedBy: "user-buyer-1",
				submittedAt: "2026-03-15T09:30:00.000Z",
			},
			{
				id: "ev-003b",
				type: "photo",
				url: "/mock-files/photo-ev003b.jpg",
				submittedBy: "user-shelter-3",
				submittedAt: "2026-03-16T14:00:00.000Z",
			},
		],
		timeline: [
			{
				event: "Dispute raised",
				actor: "user-buyer-1",
				timestamp: "2026-03-15T09:00:00.000Z",
			},
			{
				event: "Evidence submitted by adopter",
				actor: "user-buyer-1",
				timestamp: "2026-03-15T09:30:00.000Z",
			},
			{
				event: "Status changed to Under Review",
				actor: "admin-1",
				timestamp: "2026-03-16T10:00:00.000Z",
			},
			{
				event: "Evidence submitted by shelter",
				actor: "user-shelter-3",
				timestamp: "2026-03-16T14:00:00.000Z",
			},
			{
				event: "Resolved: Refunded to buyer",
				actor: "admin-1",
				timestamp: "2026-03-20T10:00:00.000Z",
			},
		],
		resolution: "Refunded to buyer",
		createdAt: "2026-03-15T09:00:00.000Z",
		updatedAt: "2026-03-20T10:00:00.000Z",
	},
	{
		id: "dispute-004",
		adoptionId: "adoption-006",
		raisedBy: "user-buyer-2",
		reason: "misleading_photos",
		description: "Not the same animal as shown in listing photos.",
		status: "open",
		isOverdue: false,
		pet: { id: "pet-4", name: "Luna" },
		adopter: { id: "user-buyer-2", name: "Alice Smith" },
		shelter: { id: "user-shelter-3", name: "Safe Haven" },
		evidence: [],
		timeline: [
			{
				event: "Dispute raised",
				actor: "user-buyer-2",
				timestamp: "2026-03-20T10:45:00.000Z",
			},
		],
		resolution: null,
		createdAt: "2026-03-20T10:45:00.000Z",
		updatedAt: "2026-03-20T10:45:00.000Z",
	},
	{
		id: "dispute-005",
		adoptionId: "adoption-007",
		raisedBy: "user-shelter-2",
		reason: "payment_issue",
		description: "Adopter has not completed the escrow funding after 7 days.",
		status: "under_review",
		isOverdue: true,
		pet: { id: "pet-5", name: "Daisy" },
		adopter: { id: "user-buyer-4", name: "Carol Davis" },
		shelter: { id: "user-shelter-2", name: "Rescue Dogs" },
		evidence: [
			{
				id: "ev-005",
				type: "document",
				url: "/mock-files/payment-screenshot.png",
				submittedBy: "user-shelter-2",
				submittedAt: "2026-03-28T16:00:00.000Z",
			},
		],
		timeline: [
			{
				event: "Dispute raised",
				actor: "user-shelter-2",
				timestamp: "2026-03-28T15:30:00.000Z",
			},
			{
				event: "Evidence submitted",
				actor: "user-shelter-2",
				timestamp: "2026-03-28T16:00:00.000Z",
			},
			{
				event: "Status changed to Under Review",
				actor: "admin-1",
				timestamp: "2026-03-29T09:15:00.000Z",
			},
			{
				event: "SLA breach detected",
				actor: "system",
				timestamp: "2026-04-04T15:30:00.000Z",
			},
		],
		resolution: null,
		createdAt: "2026-03-28T15:30:00.000Z",
		updatedAt: "2026-04-04T15:30:00.000Z",
	},
];

// ─── Detail-specific mock data with comments ──────────────────────────────────

interface DisputeComment {
	id: string;
	authorName: string;
	content: string;
	createdAt: string;
}

interface DisputeDetailMock {
	id: string;
	raisedBy: { name: string; role: string };
	reason: string;
	status: string;
	slaStatus: string;
	escrow: { status: string; accountId: string };
	evidence: { id: string; fileName: string; url: string; sha256: string }[];
	resolution?: { txHash?: string } | null;
	description?: string;
	comments?: DisputeComment[];
}

const DISPUTE_DETAIL_MOCKS: Record<string, DisputeDetailMock> = {
	"dispute-001": {
		id: "dispute-001",
		raisedBy: { name: "Alice Smith", role: "ADOPTER" },
		reason: "Health condition mismatch",
		status: "OPEN",
		slaStatus: "BREACHED",
		escrow: { status: "LOCKED", accountId: "GABC88ACCOUNT67890" },
		evidence: [
			{
				id: "ev-o-1",
				fileName: "vet-report.pdf",
				url: "/mock-files/vet-report-ev001.pdf",
				sha256: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
			},
			{
				id: "ev-o-2",
				fileName: "pet-photos-comparison.png",
				url: "/mock-files/comparison.png",
				sha256: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
			},
		],
		resolution: null,
		description: "Pet's health condition was not accurately described in the listing.",
		comments: [
			{
				id: "cmt-001",
				authorName: "Alice Smith",
				content: "I took Max to the vet and the diagnosis shows a condition that was not disclosed in the original listing. I have attached the vet report as evidence.",
				createdAt: "2026-03-23T10:45:00.000Z",
			},
			{
				id: "cmt-002",
				authorName: "Happy Paws Shelter",
				content: "We are reviewing the claim and will respond within 48 hours. The listing was updated based on the information provided by the previous owner.",
				createdAt: "2026-03-23T14:30:00.000Z",
			},
			{
				id: "cmt-003",
				authorName: "Alice Smith",
				content: "The vet report clearly states the condition existed before adoption. I expect a full resolution as per the escrow terms.",
				createdAt: "2026-03-24T09:00:00.000Z",
			},
			{
				id: "cmt-004",
				authorName: "Admin",
				content: "We have escalated this to the medical review team. The SLA deadline has been noted.",
				createdAt: "2026-03-25T10:00:00.000Z",
			},
		],
	},
	"dispute-002": {
		id: "dispute-002",
		raisedBy: { name: "Bob Johnson", role: "ADOPTER" },
		reason: "Delayed handover",
		status: "UNDER_REVIEW",
		slaStatus: "AT_RISK",
		escrow: { status: "LOCKED", accountId: "GDEF99ACCOUNT12345" },
		evidence: [
			{
				id: "ev-u-1",
				fileName: "handover-chat.png",
				url: "/mock-files/handover-chat.png",
				sha256: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
			},
		],
		resolution: null,
		description: "Shelter did not physically hand over the pet at the agreed time.",
		comments: [
			{
				id: "cmt-005",
				authorName: "Bob Johnson",
				content: "We had a scheduled handover on March 26th but the shelter did not show up. I have screenshots of our chat confirming the date.",
				createdAt: "2026-03-26T10:45:00.000Z",
			},
			{
				id: "cmt-006",
				authorName: "Rescue Dogs",
				content: "We apologize for the inconvenience. There was a medical emergency with another pet that required our immediate attention. We can reschedule for this weekend.",
				createdAt: "2026-03-26T15:20:00.000Z",
			},
			{
				id: "cmt-007",
				authorName: "Bob Johnson",
				content: "I understand emergencies happen, but I need certainty. Can you confirm a specific date and time?",
				createdAt: "2026-03-27T08:30:00.000Z",
			},
		],
	},
	"dispute-003": {
		id: "dispute-003",
		raisedBy: { name: "Eve Williams", role: "ADOPTER" },
		reason: "Unspecified escrow issues",
		status: "RESOLVED",
		slaStatus: "ON_TIME",
		escrow: { status: "RELEASED", accountId: "GHI00ACCOUNT67890" },
		evidence: [
			{
				id: "ev-r-1",
				fileName: "statement.pdf",
				url: "/mock-files/statement-ev003a.pdf",
				sha256: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
			},
			{
				id: "ev-r-2",
				fileName: "pet-photo.jpg",
				url: "/mock-files/photo-ev003b.jpg",
				sha256: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
			},
		],
		resolution: { txHash: "txhash-resolved-123456abcdef7890abcdef1234567890abcdef1234567890abcdef123456" },
		description: "Unspecified issues during escrow period.",
		comments: [
			{
				id: "cmt-008",
				authorName: "Eve Williams",
				content: "There were several issues during the escrow period that I believe warrant a full refund.",
				createdAt: "2026-03-15T09:00:00.000Z",
			},
			{
				id: "cmt-009",
				authorName: "Safe Haven",
				content: "We would like to understand the specific issues. Could you provide more details?",
				createdAt: "2026-03-15T14:00:00.000Z",
			},
			{
				id: "cmt-010",
				authorName: "Eve Williams",
				content: "I have attached a detailed statement outlining all the issues I encountered.",
				createdAt: "2026-03-16T09:30:00.000Z",
			},
			{
				id: "cmt-011",
				authorName: "Admin",
				content: "After reviewing all evidence from both parties, we have decided to issue a full refund to the adopter.",
				createdAt: "2026-03-20T10:00:00.000Z",
			},
		],
	},
	"dispute-resolved": {
		id: "dispute-resolved",
		raisedBy: { name: "Alice Smith", role: "ADOPTER" },
		reason: "Health condition mismatch",
		status: "RESOLVED",
		slaStatus: "ON_TIME",
		escrow: { status: "RELEASED", accountId: "GDRS77ACCOUNT12345" },
		evidence: [
			{
				id: "ev-r-1",
				fileName: "vet-report.pdf",
				url: "/mock-files/vet-report-ev001.pdf",
				sha256: "resolved-evidence-sha256",
			},
		],
		resolution: { txHash: "txhash-resolved-123456" },
		description: "Pet's health condition was not accurately described in the listing.",
		comments: [],
	},
	"dispute-open": {
		id: "dispute-open",
		raisedBy: { name: "Bob Johnson", role: "ADOPTER" },
		reason: "Delayed handover",
		status: "OPEN",
		slaStatus: "AT_RISK",
		escrow: { status: "LOCKED", accountId: "GABC88ACCOUNT67890" },
		evidence: [
			{
				id: "ev-o-1",
				fileName: "handover-chat.png",
				url: "/mock-files/handover-chat.png",
				sha256: "open-evidence-sha256",
			},
		],
		resolution: null,
		description: "Shelter did not physically hand over the pet at the agreed time.",
		comments: [],
	},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const disputeHandlers = [
	// GET /api/disputes — list all disputes with optional filters and pagination
	http.get("/api/disputes", async ({ request }) => {
		await delay(getDelay(request));
		const url = new URL(request.url);

		const statusParam = url.searchParams.get("status");
		const overdueParam = url.searchParams.get("overdue");
		const cursorParam = url.searchParams.get("cursor");

		let results = MOCK_DISPUTES;

		if (statusParam && statusParam !== "all") {
			results = results.filter((d) => d.status === statusParam);
		}

		if (overdueParam === "true") {
			results = results.filter((d) => d.isOverdue === true);
		}

		const pageSize = 2;
		let startIndex = 0;
		if (cursorParam) {
			const index = results.findIndex((d) => d.id === cursorParam);
			if (index !== -1) startIndex = index + 1;
		}

		const data = results.slice(startIndex, startIndex + pageSize);
		const lastItem = data[data.length - 1];
		const nextCursor =
			startIndex + pageSize < results.length && lastItem ? lastItem.id : undefined;

		return HttpResponse.json<DisputeListResponse>({ data, nextCursor });
	}),

	// GET /api/disputes/:id — detail payload with comments
	http.get("/api/disputes/:id", async ({ request, params }) => {
		await delay(getDelay(request));
		const id = String(params.id ?? "");

		if (id === "not-found") {
			return HttpResponse.json(
				{ message: `Dispute '${params.id}' not found` },
				{ status: 404 },
			);
		}

		const detail = DISPUTE_DETAIL_MOCKS[id];
		if (detail) {
			return HttpResponse.json(detail);
		}

		// Fallback for any other id — return a generic OPEN dispute
		return HttpResponse.json({
			id,
			raisedBy: { name: "Unknown User", role: "ADOPTER" },
			reason: "Unknown reason",
			status: "OPEN",
			slaStatus: "ON_TIME",
			escrow: { status: "LOCKED", accountId: `G${id.toUpperCase()}ACCOUNT000` },
			evidence: [],
			resolution: null,
			description: "No description provided.",
			comments: [],
		});
	}),

	// POST /api/disputes — raise a new dispute (handles both JSON and FormData)
	http.post("/api/disputes", async ({ request }) => {
		await delay(getDelay(request));

		let adoptionId = "";
		let raisedBy = "";
		let reason = "";
		let description = "";

		const contentType = request.headers.get("content-type") ?? "";

		if (contentType.includes("multipart/form-data")) {
			// FormData path (with file evidence)
			const formData = await request.formData();
			adoptionId = String(formData.get("adoptionId") ?? "");
			raisedBy = String(formData.get("raisedBy") ?? "");
			reason = String(formData.get("reason") ?? "");
			description = reason;
		} else {
			// JSON path (no files)
			const body = (await request.json()) as {
				adoptionId: string;
				raisedBy: string;
				reason: string;
				description?: string;
			};
			adoptionId = body.adoptionId;
			raisedBy = body.raisedBy;
			reason = body.reason;
			description = body.description ?? reason;
		}

		const created: Dispute = {
			id: `dispute-${Date.now()}`,
			adoptionId,
			raisedBy,
			reason,
			description,
			status: "open",
			isOverdue: false,
			pet: { id: "pet-new", name: "Unknown" },
			adopter: { id: "adopter-new", name: "Unknown" },
			shelter: { id: "shelter-new", name: "Unknown" },
			evidence: [],
			timeline: [
				{
					event: "Dispute raised",
					actor: raisedBy,
					timestamp: new Date().toISOString(),
				},
			],
			resolution: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		MOCK_DISPUTES.push(created);
		return HttpResponse.json<Dispute>(created, { status: 201 });
	}),

	// PATCH /api/disputes/:id/resolve — mark a dispute as resolved
	http.patch("/api/disputes/:id/resolve", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as { resolution: string; resolvedBy: string };
		const index = MOCK_DISPUTES.findIndex((d) => d.id === params.id);

		if (index === -1) {
			return HttpResponse.json({ message: "Not found" }, { status: 404 });
		}

		const base = MOCK_DISPUTES[index];
		const updated: Dispute = {
			...base,
			id: params.id as string,
			status: "resolved",
			resolution: body.resolution,
			timeline: [
				...base.timeline,
				{
					event: `Resolved: ${body.resolution}`,
					actor: body.resolvedBy,
					timestamp: new Date().toISOString(),
				},
			],
			updatedAt: new Date().toISOString(),
		};

		MOCK_DISPUTES[index] = updated;
		return HttpResponse.json<Dispute>(updated);
	}),
];
