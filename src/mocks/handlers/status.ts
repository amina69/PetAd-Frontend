import { http, HttpResponse, delay } from "msw";

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches Prisma `Adoption` model exactly plus the routes exposed by
// AdoptionController: POST /adoption/requests, PATCH /adoption/:id/approve,
// PATCH /adoption/:id/complete.

type AdoptionStatus =
	| "REQUESTED"
	| "PENDING"
	| "APPROVED"
	| "ESCROW_FUNDED"
	| "COMPLETED"
	| "REJECTED"
	| "CANCELLED";

interface Adoption {
	id: string;
	status: AdoptionStatus;
	notes: string | null;
	petId: string;
	adopterId: string;
	ownerId: string;
	escrowId: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const BASE_ADOPTION: Adoption = {
	id: "adoption-001",
	status: "ESCROW_FUNDED",
	notes: "I have a large yard and experience with dogs.",
	petId: "pet-001",
	adopterId: "user-adopter-1",
	ownerId: "user-owner-1",
	escrowId: "escrow-001",
	createdAt: "2026-03-20T08:00:00.000Z",
	updatedAt: "2026-03-22T09:30:00.000Z",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
// These mirror the exact routes in AdoptionController.

export const statusHandlers = [
	// POST /adoption/requests — requestAdoption
	http.post("/api/adoption/requests", async ({ request }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as { petId: string; notes?: string };
		const created: Adoption = {
			...BASE_ADOPTION,
			id: `adoption-${Date.now()}`,
			status: "REQUESTED",
			petId: body.petId,
			notes: body.notes ?? null,
			escrowId: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		return HttpResponse.json<Adoption>(created, { status: 201 });
	}),

	// PATCH /adoption/:id/approve — approveAdoption (Admin only)
	http.patch("/api/adoption/:id/approve", async ({ request, params }) => {
		await delay(getDelay(request));
		return HttpResponse.json<Adoption>({
			...BASE_ADOPTION,
			id: params.id as string,
			status: "APPROVED",
			updatedAt: new Date().toISOString(),
		});
	}),

	// PATCH /adoption/:id/complete — completeAdoption (Admin only)
	http.patch("/api/adoption/:id/complete", async ({ request, params }) => {
		await delay(getDelay(request));
		return HttpResponse.json<Adoption>({
			...BASE_ADOPTION,
			id: params.id as string,
			status: "COMPLETED",
			updatedAt: new Date().toISOString(),
		});
	}),
	// PATCH /api/adoption/:id/status
	http.patch("/api/adoption/:id/status", async ({ params, request }) => {
		await delay(getDelay(request));
		const body = await request.json() as { status: string };
		return HttpResponse.json({
			id: params.id,
			toStatus: body.status,
			timestamp: new Date().toISOString()
		});
	}),
];
