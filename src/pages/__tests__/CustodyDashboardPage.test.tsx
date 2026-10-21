import React from "react";
import { useEffect } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import CustodyDashboardPage from "../CustodyDashboardPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let currentSearch = "";

function SearchProbe() {
  const location = useLocation();

  useEffect(() => {
    currentSearch = location.search;
  }, [location.search]);

  return null;
}

function renderPage(initialEntry = "/custody") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <SearchProbe />
        <Routes>
          <Route path="/custody" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(<CustodyDashboardPage />, { wrapper });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("CustodyDashboardPage", () => {
  beforeEach(() => {
    currentSearch = "";
    // Freeze "today" so the dashboard always shows the same periods.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the arrangements of the active tab", async () => {
    renderPage();

    // The mock has one active arrangement for pet-1.
    expect(
      await screen.findByTestId("custody-card-custody-1"),
    ).toBeInTheDocument();
    expect(screen.getByText("Buddy")).toBeInTheDocument();
  });

  it("keeps the tab in the URL", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByTestId("custody-tab-upcoming"));

    await waitFor(() => expect(currentSearch).toContain("tab=upcoming"));

    // The upcoming tab shows the requested arrangement.
    expect(
      await screen.findByTestId("custody-card-custody-2"),
    ).toBeInTheDocument();
  });

  it("keeps the page in the URL", async () => {
    renderPage("/custody?tab=past&page=2");

    await waitFor(() => expect(currentSearch).toContain("page=2"));
    expect(screen.getByTestId("custody-tab-past")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("asks the API for the statuses of the selected tab", async () => {
    const requestedStatuses: (string | null)[] = [];

    server.use(
      http.get("*/api/custody", ({ request }) => {
        const url = new URL(request.url);
        requestedStatuses.push(url.searchParams.get("status"));
        return HttpResponse.json({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
        });
      }),
    );

    renderPage("/custody?tab=past");

    await waitFor(() => expect(requestedStatuses.length).toBeGreaterThan(0));
    expect(requestedStatuses[0]).toBe("completed,cancelled");
  });

  it("shows an empty state per tab", async () => {
    server.use(
      http.get("*/api/custody", () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 }),
      ),
    );

    renderPage("/custody?tab=upcoming");

    expect(await screen.findByTestId("custody-list-empty")).toHaveTextContent(
      "no upcoming custody arrangements",
    );
  });

  it("shows an error state with a retry", async () => {
    server.use(
      http.get("*/api/custody", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );

    renderPage();

    expect(await screen.findByTestId("custody-list-error")).toHaveTextContent(
      "Boom",
    );
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("labels the counterpart from the viewer's perspective", async () => {
    localStorage.setItem(
      "petad_user",
      JSON.stringify({ id: "user-1", fullName: "Alex Doe" }),
    );

    renderPage();

    // In the first arrangement the signed-in user is the caretaker, so the
    // counterpart is the owner.
    expect(
      await screen.findByTestId("custody-card-perspective-custody-1"),
    ).toHaveTextContent("You are the caretaker");
    expect(
      screen.getByTestId("custody-card-counterpart-custody-1"),
    ).toHaveTextContent("Sam Smith");

    localStorage.removeItem("petad_user");
  });
});
