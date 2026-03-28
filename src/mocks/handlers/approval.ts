// TODO: No backend model yet — align field names when Approval is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";


// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalDecision = "approve" | "reject" | "pending";

interface Reviewer {
	id: string;
	name: string;
	role: string;
}

interface ApprovalItem {
	id: string;
	adoptionId: string;
	reviewer: Reviewer;
	decision: ApprovalDecision;
	notes: string | null;
	createdAt: string;
	resolvedAt: string | null;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_APPROVALS: ApprovalItem[] = [
	{
		id: "approval-001",
		adoptionId: "adoption-001",
		reviewer: { id: "reviewer-1", name: "Dr. Sarah Lee", role: "vet_inspector" },
		decision: "approve",
		notes: "All documents verified. Pet health records up to date.",
		createdAt: "2026-03-20T08:00:00.000Z",
		resolvedAt: "2026-03-20T14:30:00.000Z",
	},
	{
		id: "approval-002",
		adoptionId: "adoption-001",
		reviewer: { id: "reviewer-2", name: "Mark Evans", role: "welfare_officer" },
		decision: "pending",
		notes: null,
		createdAt: "2026-03-21T09:00:00.000Z",
		resolvedAt: null,
	},
];

const PENDING_APPROVALS: ApprovalItem[] = [
	{
		id: "approval-003",
		adoptionId: "adoption-002",
		reviewer: { id: "reviewer-2", name: "Mark Evans", role: "welfare_officer" },
		decision: "pending",
		notes: null,
		createdAt: "2026-03-23T10:00:00.000Z",
		resolvedAt: null,
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const approvalHandlers = [
	// GET /api/adoption/:adoptionId/approvals — list approvals for an adoption
	http.get("/api/adoption/:adoptionId/approvals", async ({ request, params }) => {
		await delay(getDelay(request));
		const results = MOCK_APPROVALS.filter(
			(a) => a.adoptionId === params.adoptionId || params.adoptionId === "adoption-001",
		);
		return HttpResponse.json<ApprovalItem[]>(results);
	}),

	// POST /api/adoption/:adoptionId/approvals — record an approval decision
	http.post("/api/adoption/:adoptionId/approvals", async ({ request, params }) => {
		await delay(getDelay(request));
		const body = (await request.json()) as {
			reviewerId: string;
			reviewerName: string;
			reviewerRole: string;
			decision: ApprovalDecision;
			notes?: string;
		};
		const newApproval: ApprovalItem = {
			id: `approval-${Date.now()}`,
			adoptionId: params.adoptionId as string,
			reviewer: {
				id: body.reviewerId,
				name: body.reviewerName,
				role: body.reviewerRole,
			},
			decision: body.decision,
			notes: body.notes ?? null,
			createdAt: new Date().toISOString(),
			resolvedAt: body.decision !== "pending" ? new Date().toISOString() : null,
		};
		return HttpResponse.json<ApprovalItem>(newApproval, { status: 201 });
	}),

	// GET /api/approvals/pending — get the full pending approvals queue
	http.get("/api/approvals/pending", async ({ request }) => {
		await delay(getDelay(request));
		return HttpResponse.json<ApprovalItem[]>([
			...PENDING_APPROVALS,
			...MOCK_APPROVALS.filter((a) => a.decision === "pending"),
		]);
	}),
];
