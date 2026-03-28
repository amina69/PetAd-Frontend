// TODO: No backend model yet — align field names when Notification is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";


import type { Notification, NotificationType } from "../../types/notifications";

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "notif-001",
		type: "ESCROW_FUNDED" as NotificationType,
		title: "Escrow Funded",
		message: "The escrow for adoption #adoption-001 has been funded and is ready.",
		time: "2026-03-24T10:00:00.000Z",
		hasArrow: true,
		metadata: { resourceId: "adoption-001" },
	},
	{
		id: "notif-002",
		type: "APPROVAL_REQUESTED" as NotificationType,
		title: "Approval Requested",
		message: "A new approval request is waiting for your review on adoption #adoption-002.",
		time: "2026-03-24T11:30:00.000Z",
		hasArrow: true,
		metadata: { resourceId: "adoption-002" },
	},
	{
		id: "notif-003",
		type: "DISPUTE_RAISED" as NotificationType,
		title: "Dispute Raised",
		message: "A dispute has been raised on adoption #adoption-002. Please review.",
		time: "2026-03-24T14:00:00.000Z",
		hasArrow: true,
		metadata: { resourceId: "dispute-001" },
	},
	{
		id: "notif-004",
		type: "DOCUMENT_EXPIRING" as NotificationType,
		title: "Document Expiring Soon",
		message: "The vaccination certificate for adoption #adoption-001 expires in 7 days.",
		time: "2026-03-25T08:00:00.000Z",
		hasArrow: false,
		metadata: { resourceId: "adoption-001" },
	},
	{
		id: "notif-005",
		type: "SETTLEMENT_COMPLETE" as NotificationType,
		title: "Settlement Complete",
		message: "The settlement for adoption #adoption-003 has been completed successfully.",
		time: "2026-03-25T09:00:00.000Z",
		hasArrow: true,
		metadata: { resourceId: "adoption-003" },
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const notifyHandlers = [
	// GET /api/notifications — list all notifications for the current user
	http.get("/api/notifications", async ({ request }) => {
		await delay(getDelay(request));
		const url = new URL(request.url);
		const status = url.searchParams.get("status");
		const limit = Number(url.searchParams.get("limit") ?? 0);

		if (status === "UNREAD" && limit === 0) {
			return HttpResponse.json({ count: MOCK_NOTIFICATIONS.length });
		}

		return HttpResponse.json<Notification[]>(MOCK_NOTIFICATIONS);
	}),

	// PATCH /api/notifications/:id/read — mark a single notification as read
	http.patch("/api/notifications/:id/read", async ({ request }) => {
		await delay(getDelay(request));
		return new HttpResponse(null, { status: 204 });
	}),

	// POST /api/notifications/read-all — mark all notifications as read
	http.post("/api/notifications/read-all", async ({ request }) => {
		await delay(getDelay(request));
		return new HttpResponse(null, { status: 204 });
	}),
];
