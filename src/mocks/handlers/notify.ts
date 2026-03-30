// TODO: No backend model yet — align field names when Notification is added to Prisma schema.
import { http, HttpResponse, delay } from "msw";
import type { Notification, NotificationFilter, NotificationsPage, NotificationType, NotificationPreferences } from "../../types/notifications";

const _today = new Date();
const _yesterday = new Date(_today);
_yesterday.setDate(_yesterday.getDate() - 1);
const _earlier = new Date(_today);
_earlier.setDate(_earlier.getDate() - 3);

function iso(base: Date, hours: number): string {
	const d = new Date(base);
	d.setHours(hours, 0, 0, 0);
	return d.toISOString();
}

let MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "notif-001",
		type: "ESCROW_FUNDED" as NotificationType,
		title: "Escrow Funded",
		message: "The escrow for adoption #adoption-001 has been funded and is ready.",
		time: iso(_today, 10),
		isRead: false,
		hasArrow: true,
		metadata: { resourceId: "adoption-001" },
	},
	{
		id: "notif-002",
		type: "APPROVAL_REQUESTED" as NotificationType,
		title: "Approval Requested",
		message: "A new approval request is waiting for your review on adoption #adoption-002.",
		time: iso(_today, 11),
		isRead: false,
		hasArrow: true,
		metadata: { resourceId: "adoption-002" },
	},
	{
		id: "notif-003",
		type: "DISPUTE_RAISED" as NotificationType,
		title: "Dispute Raised",
		message: "A dispute has been raised on adoption #adoption-002. Please review.",
		time: iso(_yesterday, 14),
		isRead: false,
		hasArrow: true,
		metadata: { resourceId: "dispute-001" },
	},
	{
		id: "notif-004",
		type: "DOCUMENT_EXPIRING" as NotificationType,
		title: "Document Expiring Soon",
		message: "The vaccination certificate for adoption #adoption-001 expires in 7 days.",
		time: iso(_yesterday, 8),
		isRead: true,
		hasArrow: false,
		metadata: { resourceId: "adoption-001" },
	},
	{
		id: "notif-005",
		type: "SETTLEMENT_COMPLETE" as NotificationType,
		title: "Settlement Complete",
		message: "The settlement for adoption #adoption-003 has been completed successfully.",
		time: iso(_earlier, 9),
		isRead: true,
		hasArrow: true,
		metadata: { resourceId: "adoption-003" },
	},
	{
		id: "notif-006",
		type: "CUSTODY_EXPIRING" as NotificationType,
		title: "Custody Period Expiring",
		message: "The temporary custody period for pet #pet-001 expires in 2 days.",
		time: iso(_earlier, 15),
		isRead: false,
		hasArrow: true,
		metadata: { resourceId: "pet-001" },
	},
];

──

const MOCK_NOTIFICATION_PREFERENCES: NotificationPreferences = {
	APPROVAL_REQUESTED: true,
	ESCROW_FUNDED: true,
	DISPUTE_RAISED: true,
	SETTLEMENT_COMPLETE: true,
	DOCUMENT_EXPIRING: true,
	CUSTODY_EXPIRING: true,
};



const PAGE_SIZE = 10;

function getDelay(request: Request): number {
	return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

function applyFilter(list: Notification[], filter: NotificationFilter): Notification[] {
	if (filter === "unread") return list.filter((n) => !n.isRead);
	if (filter === "read") return list.filter((n) => n.isRead);
	return list;
}

export const notifyHandlers = [
	http.get("/api/notifications", async ({ request }) => {
		await delay(getDelay(request));
		const url = new URL(request.url);
		const cursor = url.searchParams.get("cursor") ?? null;
		const filter = (url.searchParams.get("filter") ?? "all") as NotificationFilter;
		const limit = Number(url.searchParams.get("limit") ?? PAGE_SIZE);
		const sorted = [...MOCK_NOTIFICATIONS].sort(
			(a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
		);
		const filtered = applyFilter(sorted, filter);
		const startIndex = cursor
			? filtered.findIndex((n) => String(n.id) === String(cursor)) + 1
			: 0;
		const page = filtered.slice(startIndex, startIndex + limit);
		const lastItem = page[page.length - 1];
		const hasMore = startIndex + limit < filtered.length;
		const response: NotificationsPage = {
			data: page,
			nextCursor: hasMore && lastItem ? String(lastItem.id) : null,
			total: filtered.length,
		};
		return HttpResponse.json<NotificationsPage>(response);
	}),

	http.patch("/api/notifications/:id/read", async ({ request, params }) => {
		await delay(getDelay(request));
		const { id } = params;
		MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) =>
			String(n.id) === String(id) ? { ...n, isRead: true } : n,
		);
		return new HttpResponse(null, { status: 204 });
	}),

	http.post("/api/notifications/read-all", async ({ request }) => {
		await delay(getDelay(request));
		MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) => ({ ...n, isRead: true }));
		return new HttpResponse(null, { status: 204 });
	}),

	// GET /api/notifications/preferences — get notification preferences
	http.get("**/api/notifications/preferences", async ({ request }) => {
		await delay(getDelay(request));
		return HttpResponse.json<NotificationPreferences>(MOCK_NOTIFICATION_PREFERENCES);
	}),

	// PATCH /api/notifications/preferences — update notification preferences
	http.patch("**/api/notifications/preferences", async ({ request }) => {
		await delay(getDelay(request));
		return new HttpResponse(null, { status: 204 });
	}),
];