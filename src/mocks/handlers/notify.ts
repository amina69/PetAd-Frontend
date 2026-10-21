// TODO: No backend model yet - align field names when Notification is added to Prisma schema.
// Simulated real-time events enabled for local development when VITE_MSW=true. close #C14
import { delay, http, HttpResponse, ws } from "msw";
import { buildNotification } from "../../test/factories/notification";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../../types/notifications";
import type {
  Notification,
  NotificationFilter,
  NotificationPreferenceType,
  NotificationPreferences,
  NotificationsPage,
  NotificationType,
} from "../../types/notifications";

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const earlier = new Date(today);
earlier.setDate(earlier.getDate() - 3);

function iso(base: Date, hours: number): string {
  const date = new Date(base);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

let mockNotifications: Notification[] = ([
  {
    id: "notif-001",
    type: "ESCROW_FUNDED" as NotificationType,
    title: "Escrow Funded",
    message: "The escrow for adoption #adoption-001 has been funded and is ready.",
    time: iso(today, 10),
    isRead: false,
    hasArrow: true,
    metadata: { resourceId: "adoption-001" },
  },
  {
    id: "notif-002",
    type: "APPROVAL_REQUESTED" as NotificationType,
    title: "Approval Requested",
    message: "A new approval request is waiting for your review on adoption #adoption-002.",
    time: iso(today, 11),
    isRead: false,
    hasArrow: true,
    metadata: { resourceId: "adoption-002" },
  },
  {
    id: "notif-003",
    type: "DISPUTE_RAISED" as NotificationType,
    title: "Dispute Raised",
    message: "A dispute has been raised on adoption #adoption-002. Please review.",
    time: iso(yesterday, 14),
    isRead: false,
    hasArrow: true,
    metadata: { resourceId: "dispute-001" },
  },
  {
    id: "notif-004",
    type: "DOCUMENT_EXPIRING" as NotificationType,
    title: "Document Expiring Soon",
    message: "The vaccination certificate for adoption #adoption-001 expires in 7 days.",
    time: iso(yesterday, 8),
    isRead: true,
    hasArrow: false,
    metadata: { resourceId: "adoption-001" },
  },
  {
    id: "notif-005",
    type: "SETTLEMENT_COMPLETE" as NotificationType,
    title: "Settlement Complete",
    message: "The settlement for adoption #adoption-003 has been completed successfully.",
    time: iso(earlier, 9),
    isRead: true,
    hasArrow: true,
    metadata: { resourceId: "adoption-003" },
  },
  {
    id: "notif-006",
    type: "CUSTODY_EXPIRING" as NotificationType,
    title: "Custody Period Expiring",
    message: "The temporary custody period for pet #pet-001 expires in 2 days.",
    time: iso(earlier, 15),
    isRead: false,
    hasArrow: true,
    metadata: { resourceId: "pet-001" },
  },
] satisfies Notification[]).map((notification) => buildNotification(notification));

// Preferences are mirrored to localStorage because MSW handler module state is
// re-created on every page load; without this, a saved preference would appear
// to reset after a reload and E2E flows covering persistence would be flaky.
const PREFERENCES_STORAGE_KEY = "petad:notification-preferences";

function readStoredPreferences(): NotificationPreferences | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotificationPreferences) : null;
  } catch {
    return null;
  }
}

function storePreferences(preferences: NotificationPreferences): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage unavailable (private mode / quota) — fall back to in-memory only.
  }
}

let mockNotificationPreferences: NotificationPreferences =
  readStoredPreferences() ?? { ...DEFAULT_NOTIFICATION_PREFERENCES };

const PAGE_SIZE = 10;

function getDelay(request: Request): number {
  return Number(new URL(request.url).searchParams.get("delay") ?? 0);
}

function applyFilter(
  list: Notification[],
  filter: NotificationFilter,
): Notification[] {
  if (filter === "unread") return list.filter((notification) => !notification.isRead);
  if (filter === "read") return list.filter((notification) => notification.isRead);
  return list;
}

// ─── Real-time stream (issue #625) ────────────────────────────────────────────
//
// With `VITE_MSW=true` the mock pushes a sample notification over the
// notifications WebSocket every N seconds, so `npm run dev` shows live toasts
// and badge updates without a backend.
//
// Every emitted event is also stored in `mockNotifications`, so a client that
// was disconnected when it fired gets it back from `GET /api/notifications`
// after reconnecting (backfill).
//
// Configuration (read when the stream starts):
//   - interval: localStorage `petad:msw:notify-interval-ms`
//               → `VITE_MSW_NOTIFY_INTERVAL_MS` → 15s
//   - paused:   localStorage `petad:msw:notify-paused` = "true"
// At runtime, from the browser console:
//   window.__petadMockNotifications.pause() / .resume() / .emit()
//   window.__petadMockNotifications.setIntervalMs(5000)
//   window.__petadMockNotifications.dropConnections()   // simulate a network blip

export const NOTIFY_INTERVAL_STORAGE_KEY = "petad:msw:notify-interval-ms";
export const NOTIFY_PAUSED_STORAGE_KEY = "petad:msw:notify-paused";
export const DEFAULT_NOTIFY_INTERVAL_MS = 15_000;

/** Close code used to simulate an abnormal drop; the client retries it. */
const ABNORMAL_CLOSE_CODE = 1011;

export interface MockNotificationEnvelope {
  eventId: string;
  type: NotificationPreferenceType;
  timestamp: string;
  payload: {
    id: string;
    title: string;
    message: string;
    isRead: false;
    metadata: { resourceId: string };
  };
}

const SAMPLE_EVENTS: Array<{
  type: NotificationPreferenceType;
  title: string;
  message: (n: number) => string;
  resourceId: string;
}> = [
  {
    type: "APPROVAL_REQUESTED",
    title: "Approval Requested",
    message: (n) => `A new adoption request (#${n}) is waiting for your review.`,
    resourceId: "adoption-002",
  },
  {
    type: "ESCROW_FUNDED",
    title: "Escrow Funded",
    message: (n) => `Escrow for adoption #${n} has been funded.`,
    resourceId: "adoption-001",
  },
  {
    type: "DISPUTE_RAISED",
    title: "Dispute Raised",
    message: (n) => `A dispute (#${n}) was raised on one of your adoptions.`,
    resourceId: "dispute-001",
  },
  {
    type: "SETTLEMENT_COMPLETE",
    title: "Settlement Complete",
    message: (n) => `Settlement #${n} completed successfully.`,
    resourceId: "adoption-003",
  },
  {
    type: "DOCUMENT_EXPIRING",
    title: "Document Expiring Soon",
    message: (n) => `Document #${n} expires in 7 days.`,
    resourceId: "adoption-001",
  },
  {
    type: "CUSTODY_EXPIRING",
    title: "Custody Period Expiring",
    message: (n) => `Custody period #${n} ends in 2 days.`,
    resourceId: "pet-001",
  },
];

export const notificationSocket = ws.link("*/api/ws/notifications");

let emittedCount = 0;
let streamTimer: ReturnType<typeof setInterval> | null = null;
let streamIntervalMs = DEFAULT_NOTIFY_INTERVAL_MS;
let streamPaused = false;

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function resolveIntervalMs(): number {
  const candidates = [
    readStorage(NOTIFY_INTERVAL_STORAGE_KEY),
    import.meta.env.VITE_MSW_NOTIFY_INTERVAL_MS as string | undefined,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (candidate && Number.isFinite(value) && value > 0) return value;
  }
  return DEFAULT_NOTIFY_INTERVAL_MS;
}

/**
 * Creates a sample notification, stores it for `GET /api/notifications`, and
 * pushes it to every connected client. Works whether or not anyone is
 * connected — that is what makes reconnect backfill observable.
 */
export function emitMockNotification(
  overrides: Partial<Pick<MockNotificationEnvelope, "type">> & {
    title?: string;
    message?: string;
  } = {},
): MockNotificationEnvelope {
  emittedCount += 1;
  const sample =
    SAMPLE_EVENTS.find((event) => event.type === overrides.type) ??
    SAMPLE_EVENTS[(emittedCount - 1) % SAMPLE_EVENTS.length];
  const timestamp = new Date().toISOString();
  const id = `notif-live-${Date.now()}-${emittedCount}`;

  const envelope: MockNotificationEnvelope = {
    eventId: `evt_${id}`,
    type: sample.type,
    timestamp,
    payload: {
      id,
      title: overrides.title ?? sample.title,
      message: overrides.message ?? sample.message(emittedCount),
      isRead: false,
      metadata: { resourceId: sample.resourceId },
    },
  };

  mockNotifications = [
    {
      id,
      type: sample.type as NotificationType,
      title: envelope.payload.title,
      message: envelope.payload.message,
      time: timestamp,
      isRead: false,
      hasArrow: true,
      metadata: envelope.payload.metadata,
    },
    ...mockNotifications,
  ];

  notificationSocket.broadcast(JSON.stringify(envelope));
  return envelope;
}

function clearStreamTimer(): void {
  if (streamTimer !== null) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
}

function scheduleStream(): void {
  clearStreamTimer();
  if (streamPaused) return;
  streamTimer = setInterval(() => emitMockNotification(), streamIntervalMs);
}

/** Starts the periodic stream (idempotent). */
export function startMockNotificationStream(
  options: { intervalMs?: number; paused?: boolean } = {},
): void {
  streamIntervalMs = options.intervalMs ?? resolveIntervalMs();
  streamPaused = options.paused ?? readStorage(NOTIFY_PAUSED_STORAGE_KEY) === "true";
  scheduleStream();
}

export function stopMockNotificationStream(): void {
  clearStreamTimer();
}

export function pauseMockNotificationStream(): void {
  streamPaused = true;
  clearStreamTimer();
}

export function resumeMockNotificationStream(): void {
  streamPaused = false;
  scheduleStream();
}

export function setMockNotificationInterval(intervalMs: number): void {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
  streamIntervalMs = intervalMs;
  if (streamTimer !== null) scheduleStream();
}

export function isMockNotificationStreamRunning(): boolean {
  return streamTimer !== null;
}

/** Abnormally closes every client socket so the app's reconnect path runs. */
export function dropMockNotificationConnections(): void {
  notificationSocket.clients.forEach((client) => {
    client.close(ABNORMAL_CLOSE_CODE, "mock network drop");
  });
}

const isDevMockRuntime =
  typeof window !== "undefined" && import.meta.env.VITE_MSW === "true";

if (isDevMockRuntime) {
  (window as Window & { __petadMockNotifications?: unknown }).__petadMockNotifications = {
    emit: emitMockNotification,
    pause: pauseMockNotificationStream,
    resume: resumeMockNotificationStream,
    setIntervalMs: setMockNotificationInterval,
    dropConnections: dropMockNotificationConnections,
  };
}

export const notifyHandlers = [
  http.get("/api/notifications", async ({ request }) => {
    await delay(getDelay(request));
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? null;
    const filter = (url.searchParams.get("filter") ?? "all") as NotificationFilter;
    const limit = Number(url.searchParams.get("limit") ?? PAGE_SIZE);
    const sorted = [...mockNotifications].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
    const filtered = applyFilter(sorted, filter);
    const startIndex = cursor
      ? filtered.findIndex((notification) => String(notification.id) === String(cursor)) + 1
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

  // GET /api/notifications/preferences - get notification preferences
  // NOTE: registered before `/notifications/:id` so the literal path is not
  // swallowed by the dynamic segment (which would 404 as id="preferences").
  http.get("**/api/notifications/preferences", async ({ request }) => {
    await delay(getDelay(request));
    return HttpResponse.json<NotificationPreferences>(mockNotificationPreferences);
  }),

  http.get("/api/notifications/:id", async ({ params, request }) => {
    await delay(getDelay(request));
    const { id } = params;
    const notification = mockNotifications.find((n) => String(n.id) === String(id));
    if (!notification) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json<Notification>(notification);
  }),

  http.patch("/api/notifications/:id/read", async ({ params, request }) => {
    await delay(getDelay(request));
    const { id } = params;
    mockNotifications = mockNotifications.map((notification) =>
      String(notification.id) === String(id)
        ? { ...notification, isRead: true }
        : notification,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/notifications/read-all", async ({ request }) => {
    await delay(getDelay(request));
    mockNotifications = mockNotifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /api/notifications/preferences - update notification preferences
  http.patch("**/api/notifications/preferences", async ({ request }) => {
    await delay(getDelay(request));

    try {
      const body = (await request.json()) as Partial<NotificationPreferences> | null;
      if (body && typeof body === "object") {
        mockNotificationPreferences = {
          ...mockNotificationPreferences,
          ...body,
        };
        storePreferences(mockNotificationPreferences);
      }
      return HttpResponse.json<NotificationPreferences>(mockNotificationPreferences);
    } catch {
      return new HttpResponse(null, { status: 400 });
    }
  }),

  // Real-time pushes. The stream only auto-starts in the dev mock runtime;
  // tests drive it explicitly via `emitMockNotification()`.
  notificationSocket.addEventListener("connection", () => {
    if (isDevMockRuntime && !isMockNotificationStreamRunning() && !streamPaused) {
      startMockNotificationStream();
    }
  }),
];
