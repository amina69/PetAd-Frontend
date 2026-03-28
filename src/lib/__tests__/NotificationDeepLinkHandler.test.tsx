import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { NotificationDeepLinkHandler } from "../NotificationDeepLinkHandler";
import { apiClient } from "../api-client";
import { NotFoundError } from "../api-errors";

function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("NotificationDeepLinkHandler", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads notificationId, marks notification read, navigates, and removes the param", async () => {
    window.history.replaceState({}, "", "/?notificationId=notif-001");

    vi.spyOn(apiClient, "get").mockResolvedValue({
      id: "notif-001",
      type: "ESCROW_FUNDED",
      title: "Escrow Funded",
      message: "Payment received",
      time: "2026-03-24T10:00:00.000Z",
      metadata: { resourceId: "adoption-001" },
    });
    vi.spyOn(apiClient, "patch").mockResolvedValue({});

    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/"]}>
        <NotificationDeepLinkHandler />
        <Routes>
          <Route path="/adoption/:id/settlement" element={<CurrentLocation />} />
          <Route path="/" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getByTestId("location").textContent).toBe("/adoption/adoption-001/settlement");
    });

    expect(apiClient.get).toHaveBeenCalledWith("/notifications/notif-001");
    expect(apiClient.patch).toHaveBeenCalledWith("/notifications/notif-001/read");
    expect(window.location.search).toBe("");
  });

  it("logs not found and removes the param without navigating", async () => {
    window.history.replaceState({}, "", "/?notificationId=missing-id");

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(apiClient, "get").mockRejectedValue(
      new NotFoundError("Not found", { status: 404 }),
    );
    vi.spyOn(apiClient, "patch").mockResolvedValue({});

    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/"]}>
        <NotificationDeepLinkHandler />
        <Routes>
          <Route path="/" element={<CurrentLocation />} />
          <Route path="/notifications" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getByTestId("location").textContent).toBe("/");
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "Notification deep-link not found: missing-id",
    );
    expect(window.location.search).toBe("");
    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
