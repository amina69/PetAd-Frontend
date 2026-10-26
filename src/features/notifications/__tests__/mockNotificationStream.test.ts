import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_NOTIFY_INTERVAL_MS,
  NOTIFY_INTERVAL_STORAGE_KEY,
  NOTIFY_PAUSED_STORAGE_KEY,
  emitMockNotification,
  isMockNotificationStreamRunning,
  notificationSocket,
  pauseMockNotificationStream,
  resumeMockNotificationStream,
  setMockNotificationInterval,
  startMockNotificationStream,
  stopMockNotificationStream,
} from "../../../mocks/handlers/notify";
import type { NotificationsPage } from "../../../types/notifications";

/**
 * C30. Controls of the periodic MSW notification stream.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/625
 */
describe("mock notification stream", () => {
  let broadcast: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    broadcast = vi.spyOn(notificationSocket, "broadcast");
  });

  afterEach(() => {
    stopMockNotificationStream();
    broadcast.mockRestore();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("emits a well-formed envelope and stores it for GET /api/notifications", async () => {
    const envelope = emitMockNotification({ type: "DISPUTE_RAISED" });

    expect(envelope).toMatchObject({
      type: "DISPUTE_RAISED",
      payload: { title: "Dispute Raised", isRead: false, metadata: { resourceId: "dispute-001" } },
    });
    expect(envelope.eventId).toBe(`evt_${envelope.payload.id}`);
    expect(JSON.parse(broadcast.mock.calls[0][0] as string)).toEqual(envelope);

    const response = await fetch("/api/notifications?filter=unread&limit=50");
    const page = (await response.json()) as NotificationsPage;
    expect(page.data[0]).toMatchObject({ id: envelope.payload.id, isRead: false });
  });

  it("cycles through sample event types when no type is given", () => {
    const types = new Set(Array.from({ length: 6 }, () => emitMockNotification().type));
    expect(types.size).toBe(6);
  });

  it("emits on the configured interval", () => {
    startMockNotificationStream({ intervalMs: 1_000 });
    expect(isMockNotificationStreamRunning()).toBe(true);

    vi.advanceTimersByTime(3_000);
    expect(broadcast).toHaveBeenCalledTimes(3);
  });

  it("can be paused and resumed", () => {
    startMockNotificationStream({ intervalMs: 1_000 });
    pauseMockNotificationStream();
    vi.advanceTimersByTime(5_000);
    expect(broadcast).not.toHaveBeenCalled();
    expect(isMockNotificationStreamRunning()).toBe(false);

    resumeMockNotificationStream();
    vi.advanceTimersByTime(1_000);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it("changes the interval of a running stream", () => {
    startMockNotificationStream({ intervalMs: 10_000 });
    setMockNotificationInterval(500);
    vi.advanceTimersByTime(1_000);
    expect(broadcast).toHaveBeenCalledTimes(2);

    // Invalid values are ignored.
    setMockNotificationInterval(0);
    vi.advanceTimersByTime(500);
    expect(broadcast).toHaveBeenCalledTimes(3);
  });

  it("does not start a stopped stream when only the interval changes", () => {
    setMockNotificationInterval(500);
    vi.advanceTimersByTime(2_000);
    expect(isMockNotificationStreamRunning()).toBe(false);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("reads interval and paused state from localStorage", () => {
    localStorage.setItem(NOTIFY_INTERVAL_STORAGE_KEY, "250");
    startMockNotificationStream();
    vi.advanceTimersByTime(1_000);
    expect(broadcast).toHaveBeenCalledTimes(4);
    stopMockNotificationStream();

    localStorage.setItem(NOTIFY_PAUSED_STORAGE_KEY, "true");
    startMockNotificationStream();
    vi.advanceTimersByTime(1_000);
    expect(broadcast).toHaveBeenCalledTimes(4);
    expect(isMockNotificationStreamRunning()).toBe(false);
  });

  it("falls back to the default interval for invalid stored values", () => {
    localStorage.setItem(NOTIFY_INTERVAL_STORAGE_KEY, "soon");
    startMockNotificationStream();
    vi.advanceTimersByTime(DEFAULT_NOTIFY_INTERVAL_MS - 1);
    expect(broadcast).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });
});
