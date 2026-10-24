import React from "react";
import { render, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { BATCH_WINDOW_MS, useNotifications } from "../useNotifications";
import type { Notification, NotificationsPage } from "../../types/notifications";

/**
 * Render-count test helper (issue #548, G6): the Probe component records
 * how many times its function body executes — the same number the React
 * DevTools profiler reports — plus the hook state visible on each render.
 */
function createProbe() {
  const probe = {
    renders: 0,
    markRead: undefined as undefined | ((id: string | number) => void),
    notifications: [] as Notification[],
  };

  function Probe() {
    probe.renders += 1;
    const { notifications, markRead } = useNotifications("all");
    probe.markRead = markRead;
    probe.notifications = notifications;
    return (
      <ul>
        {notifications.map((n) => (
          <li key={String(n.id)}>{n.title}</li>
        ))}
      </ul>
    );
  }

  return { probe, Probe };
}

/** Override the default 6-item mock with 20 unread notifications. */
function mockTwentyNotifications() {
  const unreads: Notification[] = Array.from({ length: 20 }, (_, i) => ({
    id: `notif-${i + 1}`,
    type: "ESCROW_FUNDED" as const,
    title: `Notification ${i + 1}`,
    message: "message",
    time: new Date().toISOString(),
    isRead: false,
  }));
  server.use(
    http.get("/api/notifications", () => {
      const page: NotificationsPage = {
        data: unreads,
        nextCursor: null,
        total: 20,
      };
      return HttpResponse.json<NotificationsPage>(page);
    }),
  );
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
}

describe("useNotifications batching (issue #548, G6)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTwentyNotifications();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("a burst of 20 events in under 1s produces no more than 4 renders", async () => {
    const patchIds: string[] = [];
    server.use(
      http.patch("/api/notifications/:id/read", ({ params }) => {
        patchIds.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { probe, Probe } = createProbe();
    const { unmount } = render(<Probe />, { wrapper: createWrapper() });

    // Let the initial list query resolve (MSW delay runs on the fake clock).
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(probe.notifications).toHaveLength(20);

    // Baseline render count before the burst.
    const rendersBeforeBurst = probe.renders;
    expect(rendersBeforeBurst).toBeGreaterThan(0);

    // Simulated burst: 20 rapid-fire events in well under 1 second.
    act(() => {
      for (let i = 1; i <= 20; i++) {
        probe.markRead?.(`notif-${i}`);
      }
    });

    // The events are only queued here — no per-event state updates yet.
    expect(probe.renders - rendersBeforeBurst).toBeLessThanOrEqual(4);

    // Close the batch window: exactly ONE cache write flushes the queue.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BATCH_WINDOW_MS + 50);
    });

    // Acceptance criteria: a burst of 20 events in under 1s produces no
    // more than ~4 renders (instead of one per event).
    expect(probe.renders - rendersBeforeBurst).toBeLessThanOrEqual(4);
    expect(probe.renders).toBeGreaterThan(rendersBeforeBurst); // flush rendered once

    // All 20 optimistic updates applied through the single cache write.
    expect(probe.notifications.every((n) => n.isRead)).toBe(true);

    // Persisted to the network once the window closed.
    expect(patchIds.sort()).toEqual(
      Array.from({ length: 20 }, (_, i) => `notif-${i + 1}`).sort(),
    );

    unmount();
  });

  it("coalesces events spread across two windows into one flush per window", async () => {
    const patchIds: string[] = [];
    server.use(
      http.patch("/api/notifications/:id/read", ({ params }) => {
        patchIds.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { probe, Probe } = createProbe();
    const { unmount } = render(<Probe />, { wrapper: createWrapper() });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const rendersBeforeBurst = probe.renders;

    // Window 1: 10 events.
    act(() => {
      for (let i = 1; i <= 10; i++) probe.markRead?.(`notif-${i}`);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BATCH_WINDOW_MS + 50);
    });

    // Window 2: 10 more events.
    act(() => {
      for (let i = 11; i <= 20; i++) probe.markRead?.(`notif-${i}`);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BATCH_WINDOW_MS + 50);
    });

    // Two windows → at most ~2 flush renders, never 20.
    expect(probe.renders - rendersBeforeBurst).toBeLessThanOrEqual(4);
    expect(patchIds).toHaveLength(20);

    unmount();
  });
});
