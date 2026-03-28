// TODO: No backend model yet — align field names when Dispute is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";


// ─── Types ────────────────────────────────────────────────────────────────────

type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

interface Evidence {
	id: string;
	type: "document" | "photo" | "statement";
	url: string;
	submittedBy: string;
	submittedAt: string;
}

interface TimelineEvent {
	event: string;
	actor: string;
	timestamp: string;
}

interface Dispute {
	id: string;
	adoptionId: string;
	raisedBy: string;
	reason: string;
	description: string;
	status: DisputeStatus;
	evidence: Evidence[];
	timeline: TimelineEvent[];
	resolution: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
	{
		id: "dispute-001",
		adoptionId: "adoption-002",
		raisedBy: "user-buyer-2",
		reason: "misrepresentation",
		description: "Pet's health condition was not accurately described in the listing.",
		status: "open",
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
		],
		resolution: null,
		createdAt: "2026-03-23T10:45:00.000Z",
		updatedAt: "2026-03-23T11:00:00.000Z",
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const disputeHandlers = [
	// GET /api/disputes — list all open disputes
	http.get("/api/disputes", async ({ request }) => {
		await delay(getDelay(request));
		return HttpResponse.json<Dispute[]>(MOCK_DISPUTES);
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
		return HttpResponse.json<Dispute>(created, { status: 201 });
	}),

	// PATCH /api/disputes/:id/resolve — mark a dispute as resolved
	http.patch("/api/disputes/:id/resolve", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as { resolution: string; resolvedBy: string };
		const base = MOCK_DISPUTES.find((d) => d.id === params.id) ?? MOCK_DISPUTES[0];
		return HttpResponse.json<Dispute>({
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
		});
	}),
];
