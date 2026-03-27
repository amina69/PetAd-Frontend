// TODO: No backend model yet — align field names when Dispute is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";
import type { DisputeDetails } from "../../types/dispute";


// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: DisputeDetails[] = [
	{
		id: "dispute-001",
		adoptionId: "adoption-002",
		raisedBy: {
			id: "user-buyer-2",
			name: "Amara Okafor",
			role: "ADOPTER",
		},
		reason: "misrepresentation",
		description: "Pet's health condition was not accurately described in the listing.",
		status: "OPEN",
		slaDeadlineAt: "2026-03-28T18:00:00.000Z",
		escrow: {
			escrowId: "escrow-204",
			accountId: "GABCD1234PETADESCROWACCOUNT567890ABCDEF1234567890PETAD",
			onChainStatus: "DISPUTED",
		},
		evidence: [
			{
				id: "ev-001",
				fileName: "vet-health-report.pdf",
				downloadUrl: "https://res.cloudinary.com/petad/raw/upload/v1/disputes/dispute-001/vet-health-report.pdf",
				sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
				mimeType: "application/pdf",
				submittedBy: {
					id: "user-buyer-2",
					name: "Amara Okafor",
					role: "ADOPTER",
				},
				submittedAt: "2026-03-23T11:00:00.000Z",
			},
			{
				id: "ev-002",
				fileName: "chat-screenshot.png",
				downloadUrl: "https://res.cloudinary.com/petad/image/upload/v1/disputes/dispute-001/chat-screenshot.png",
				sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
				mimeType: "image/png",
				submittedBy: {
					id: "user-buyer-2",
					name: "Amara Okafor",
					role: "ADOPTER",
				},
				submittedAt: "2026-03-23T11:15:00.000Z",
			},
		],
		timeline: [
			{
				event: "Dispute raised",
				actor: "Amara Okafor",
				timestamp: "2026-03-23T10:45:00.000Z",
			},
			{
				event: "Evidence submitted",
				actor: "Amara Okafor",
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
		return HttpResponse.json<DisputeDetails[]>(MOCK_DISPUTES);
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
		return HttpResponse.json<DisputeDetails>(found);
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
		const created: DisputeDetails = {
			id: `dispute-${Date.now()}`,
			adoptionId: body.adoptionId,
			raisedBy: {
				id: body.raisedBy,
				name: "Current User",
				role: "ADOPTER",
			},
			reason: body.reason,
			description: body.description,
			status: "OPEN",
			slaDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
			escrow: {
				escrowId: `escrow-${Date.now()}`,
				accountId: "GBNEWDISPUTEESCROWACCOUNT1234567890ABCDEFGHIJKLMNOPQRST",
				onChainStatus: "DISPUTED",
			},
			evidence: [],
			timeline: [
				{
					event: "Dispute raised",
					actor: "Current User",
					timestamp: new Date().toISOString(),
				},
			],
			resolution: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		return HttpResponse.json<DisputeDetails>(created, { status: 201 });
	}),

	// PATCH /api/disputes/:id/resolve — mark a dispute as resolved
	http.patch("/api/disputes/:id/resolve", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as { resolution: string; resolvedBy: string };
		const base = MOCK_DISPUTES.find((d) => d.id === params.id) ?? MOCK_DISPUTES[0];
		return HttpResponse.json<DisputeDetails>({
			...base,
			id: params.id as string,
			status: "RESOLVED",
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
