import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationDeepLink } from "../useNotificationDeepLink";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockNotification = {
  id: "42",
  type: "DISPUTE_RAISED",
  title: "Dispute",
  message: "A dispute was raised",
  time: "2024-01-01T00:00:00Z",
  metadata: { resourceId: "99" },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useNotificationDeepLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    window.history.replaceState(null, "", "/home?notificationId=42");
  });

  it("fetches notification, marks read, navigates, and removes param", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockNotification) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response); // mark read

    renderHook(() => useNotificationDeepLink(), { wrapper });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/disputes/99", { replace: true }));

    expect(fetch).toHaveBeenCalledWith("/api/notifications/42");
    expect(fetch).toHaveBeenCalledWith("/api/notifications/42/read", { method: "PATCH" });
    expect(window.location.search).not.toContain("notificationId");
  });

  it("logs and continues when notification is 404", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);

    renderHook(() => useNotificationDeepLink(), { wrapper });

    await waitFor(() => expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("not found")));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does nothing when notificationId param is absent", () => {
    window.history.replaceState(null, "", "/home");

    renderHook(() => useNotificationDeepLink(), { wrapper });

    expect(fetch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
