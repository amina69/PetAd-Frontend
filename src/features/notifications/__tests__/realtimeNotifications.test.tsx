import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { DeferredNotificationCentreDropdown } from "../../../components/notifications/DeferredNotificationCentreDropdown";
import {
  NotificationSocketProvider,
  useNotificationSocket,
} from "../../../context/NotificationSocketContext";
import {
  dropMockNotificationConnections,
  emitMockNotification,
  notificationSocket,
  stopMockNotificationStream,
} from "../../../mocks/handlers/notify";

/**
 * C30. End-to-end-in-jsdom: the MSW WebSocket mock pushes events through the
 * real NotificationSocketProvider into toasts and the navbar badge.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/625
 */

function ConnectionState() {
  const { connectionState } = useNotificationSocket();
  return <span data-testid="connection-state">{connectionState}</span>;
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NotificationSocketProvider>
          <MemoryRouter>
            <ConnectionState />
            <DeferredNotificationCentreDropdown />
          </MemoryRouter>
        </NotificationSocketProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function badgeCount(): Promise<number> {
  const badge = await screen.findByTestId("notification-unread-count");
  return Number(badge.textContent);
}

async function waitForConnected() {
  await waitFor(() =>
    expect(screen.getByTestId("connection-state")).toHaveTextContent("connected"),
  );
  await waitFor(() => expect(notificationSocket.clients.size).toBeGreaterThan(0));
}

describe("real-time notifications via the MSW socket mock", () => {
  beforeEach(() => {
    localStorage.setItem("auth_token", "test-token");
  });

  afterEach(() => {
    stopMockNotificationStream();
    localStorage.clear();
  });

  it("shows a toast and bumps the badge when an event is pushed, without a reload", async () => {
    renderApp();
    await waitForConnected();
    const before = await badgeCount();

    act(() => {
      emitMockNotification({
        type: "ESCROW_FUNDED",
        title: "Escrow Funded",
        message: "Live escrow update",
      });
    });

    expect(await screen.findByText("Live escrow update")).toBeInTheDocument();
    await waitFor(async () => expect(await badgeCount()).toBe(before + 1));
  });

  it("backfills events missed while the socket was down once it reconnects", async () => {
    renderApp();
    await waitForConnected();
    const before = await badgeCount();

    act(() => dropMockNotificationConnections());
    await waitFor(() =>
      expect(screen.getByTestId("connection-state")).toHaveTextContent("reconnecting"),
    );

    // Emitted while offline: no client receives it, so no toast …
    act(() => {
      emitMockNotification({ title: "Missed while offline", message: "Backfilled event" });
    });
    expect(screen.queryByText("Backfilled event")).not.toBeInTheDocument();

    // … but the reconnect refetch picks it up.
    await waitFor(
      () => expect(screen.getByTestId("connection-state")).toHaveTextContent("connected"),
      { timeout: 5_000 },
    );
    await waitFor(async () => expect(await badgeCount()).toBe(before + 1));
    expect(screen.queryByText("Backfilled event")).not.toBeInTheDocument();
  });

  it("ignores frames that are not notification envelopes", async () => {
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");
    renderApp();
    await waitForConnected();
    invalidate.mockClear();

    act(() => {
      notificationSocket.broadcast("pong");
      notificationSocket.broadcast(JSON.stringify({ type: "HEARTBEAT" }));
    });

    // Give the frames time to be delivered.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(invalidate).not.toHaveBeenCalled();
    invalidate.mockRestore();
  });

  it("keeps the badge on the full dropdown once the trigger is opened", async () => {
    renderApp();
    await waitForConnected();
    const count = await badgeCount();

    const trigger = screen.getByRole("button", {
      name: `Open notifications, ${count} unread`,
    });
    await userEvent.setup().click(trigger);

    expect(await screen.findByTestId("notification-dropdown")).toBeInTheDocument();
    expect(await badgeCount()).toBe(count);
  });

  it("hides the badge when the unread count cannot be loaded", async () => {
    server.use(
      http.get("/api/notifications", ({ request }) =>
        new URL(request.url).searchParams.get("filter") === "unread"
          ? HttpResponse.json({}, { status: 500 })
          : undefined,
      ),
    );
    renderApp();
    await waitForConnected();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByTestId("notification-unread-count")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open notifications" })).toBeInTheDocument();
  });
});
