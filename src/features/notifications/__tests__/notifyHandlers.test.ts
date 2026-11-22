import { describe, expect, it } from "vitest";
import { emitMockNotification } from "../../../mocks/handlers/notify";
import type { Notification, NotificationsPage } from "../../../types/notifications";

/**
 * C30. REST side of the notification mock, which is what reconnect backfill
 * reads from: live events must be listable, fetchable and markable as read.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/625
 */
async function unreadTotal(): Promise<number> {
  const response = await fetch("/api/notifications?filter=unread&limit=1");
  return ((await response.json()) as NotificationsPage).total;
}

describe("notification REST mock", () => {
  it("serves an emitted event by id and lets it be marked read", async () => {
    const { payload } = emitMockNotification();
    const before = await unreadTotal();

    const detail = await fetch(`/api/notifications/${payload.id}`);
    expect(((await detail.json()) as Notification).title).toBe(payload.title);

    const read = await fetch(`/api/notifications/${payload.id}/read`, { method: "PATCH" });
    expect(read.status).toBe(204);
    expect(await unreadTotal()).toBe(before - 1);
  });

  it("returns 404 for an unknown notification", async () => {
    const response = await fetch("/api/notifications/does-not-exist");
    expect(response.status).toBe(404);
  });

  it("paginates with a cursor and filters read items", async () => {
    const first = (await (
      await fetch("/api/notifications?filter=all&limit=2")
    ).json()) as NotificationsPage;
    expect(first.data).toHaveLength(2);
    expect(first.nextCursor).toBe(String(first.data[1].id));

    const second = (await (
      await fetch(`/api/notifications?filter=all&limit=2&cursor=${first.nextCursor}`)
    ).json()) as NotificationsPage;
    expect(second.data[0].id).not.toBe(first.data[0].id);

    const read = (await (
      await fetch("/api/notifications?filter=read&limit=50")
    ).json()) as NotificationsPage;
    expect(read.data.every((n) => n.isRead)).toBe(true);
  });

  it("marks everything read, including live events", async () => {
    emitMockNotification();
    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    expect(response.status).toBe(204);
    expect(await unreadTotal()).toBe(0);
  });

  it("merges partial preference updates", async () => {
    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CUSTODY_EXPIRING: false }),
    });
    const prefs = await response.json();
    expect(prefs.CUSTODY_EXPIRING).toBe(false);
    expect(prefs.ESCROW_FUNDED).toBe(true);

    const invalid = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      body: "{not json",
    });
    expect(invalid.status).toBe(400);
  });
});
