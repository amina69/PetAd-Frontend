// TODO: No backend model yet — align field names when Dispute is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";
<<<<<<< feat/AdminDisputeListPage
import type { Dispute, DisputeListResponse, DisputeStatus } from "../../types/dispute";
=======
import type { Dispute, DisputeListResponse } from "../../types/dispute";
>>>>>>> main

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
		],
		resolution: null,
		createdAt: "2026-03-23T10:45:00.000Z",
		updatedAt: "2026-03-23T11:00:00.000Z",
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
		evidence: [],
		timeline: [],
		resolution: null,
		createdAt: "2026-03-26T10:45:00.000Z",
		updatedAt: "2026-03-26T10:45:00.000Z",
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
		evidence: [],
		timeline: [],
		resolution: "Refunded to buyer",
		createdAt: "2026-03-15T09:00:00.000Z",
		updatedAt: "2026-03-20T10:00:00.000Z",
	},
	{
		id: "dispute-004",
		adoptionId: "adoption-006",
		raisedBy: "user-buyer-2",
		reason: "misleading_photos",
		description: "Not the same animal as shown.",
		status: "open",
		isOverdue: true,
		pet: { id: "pet-4", name: "Luna" },
		adopter: { id: "user-buyer-2", name: "Alice Smith" },
		shelter: { id: "user-shelter-3", name: "Safe Haven" },
		evidence: [],
		timeline: [],
		resolution: null,
		createdAt: "2026-03-20T10:45:00.000Z",
		updatedAt: "2026-03-20T10:45:00.000Z",
	},
];

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

		// 1) Filter status
		if (statusParam && statusParam !== "all") {
			results = results.filter(d => d.status === statusParam);
		}

		// 2) Filter overdue
		if (overdueParam === "true") {
			results = results.filter(d => d.isOverdue === true);
		}

		// 3) Pagination (using ID as cursor for simplicity)
		// Assume page size is 2 to make testing pagination easy
		const pageSize = 2;
		let startIndex = 0;
		if (cursorParam) {
			const index = results.findIndex(d => d.id === cursorParam);
			if (index !== -1) {
				startIndex = index + 1; // start after the cursor
			}
		}

		const data = results.slice(startIndex, startIndex + pageSize);
		const lastItem = data[data.length - 1];
		
		// Determine if there's more data
		const nextCursor = (startIndex + pageSize < results.length && lastItem) ? lastItem.id : undefined;

		return HttpResponse.json<DisputeListResponse>({
			data,
			nextCursor
		});
	}),

	// GET /api/disputes/:id — get a single dispute with evidence and timeline
	http.get("/api/disputes/:id", async ({ request, params }) => {
		await delay(getDelay(request));
		const found = MOCK_DISPUTES.find((d) => d.id === params.id);
		if (!found) {
			return HttpResponse.json(
				{ message: `Dispute '${params.id}' not found` },
				{ status: 404 },
			);
		}
		return HttpResponse.json<Dispute>(found);
	}),

	// POST /api/disputes — raise a new dispute
	http.post("/api/disputes", async ({ request }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as {
			adoptionId: string;
			raisedBy: string;
			reason: string;
			description: string;
		};
		const created: Dispute = {
			id: `dispute-${Date.now()}`,
			adoptionId: body.adoptionId,
			raisedBy: body.raisedBy,
			reason: body.reason,
			description: body.description,
			status: "open",
			isOverdue: false,
			pet: { id: "pet-new", name: "Unknown" },
			adopter: { id: "adopter-new", name: "Unknown" },
			shelter: { id: "shelter-new", name: "Unknown" },
			evidence: [],
			timeline: [
				{
					event: "Dispute raised",
					actor: body.raisedBy,
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
