import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import ApprovalListPage from "../ApprovalListPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper(initialEntries: string[] = ["/"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
}

function renderPage(initialEntries?: string[]) {
  const { wrapper } = createWrapper(initialEntries);
  return render(<ApprovalListPage />, { wrapper });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("ApprovalListPage", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  // ── Loading state ────────────────────────────────────────────────────────

  it("renders skeleton cards during loading that match the typical page size", () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage();

    const skeletons = screen.getAllByTestId("approval-card-skeleton");
    expect(skeletons).toHaveLength(6);
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it("renders default empty state when no items and 'all' tab is active", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage();

    const emptyTitle = await screen.findByText("No approval history yet");
    expect(emptyTitle).toBeInTheDocument();
  });

  it("renders tab-specific empty copy for 'Pending' tab", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage(["/?tab=PENDING"]);

    await waitFor(() => {
      expect(screen.getByText("No pending requests right now")).toBeInTheDocument();
    });
  });

  it("renders tab-specific empty copy for 'Approved' tab", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage(["/?tab=APPROVED"]);

    await waitFor(() => {
      expect(screen.getByText("No approved requests")).toBeInTheDocument();
    });
  });

  it("renders tab-specific empty copy for 'Rejected' tab", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage(["/?tab=REJECTED"]);

    await waitFor(() => {
      expect(screen.getByText("No rejection history yet")).toBeInTheDocument();
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────

  it("renders error state with retry button when API returns 500", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return new HttpResponse(
          JSON.stringify({ message: "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    renderPage();

    const errorState = await screen.findByTestId("approval-error");
    expect(errorState).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByText("Failed to load the approval list. Please try again.")).toBeInTheDocument();
  });

  it("retry button triggers exactly one new network call per click", async () => {
    let callCount = 0;

    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        callCount++;

        if (callCount === 1) {
          return new HttpResponse(
            JSON.stringify({ message: "Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        return HttpResponse.json({
          items: [
            {
              id: "app-retry-1",
              petName: "Buddy",
              applicantName: "John Doe",
              status: "PENDING",
              submittedAt: "2026-06-01T10:00:00Z",
            },
          ],
          total: 1,
        });
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByTestId("retry-button")).toBeInTheDocument());
    expect(callCount).toBe(1);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("retry-button"));

    await waitFor(() => expect(callCount).toBe(2));
    expect(screen.getByText("Buddy")).toBeInTheDocument();
  });

  // ── Data state ───────────────────────────────────────────────────────────

  it("renders approval items with correct data", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({
          items: [
            {
              id: "app-1",
              petName: "Buddy",
              applicantName: "John Doe",
              status: "PENDING",
              submittedAt: "2026-06-01T10:00:00Z",
            },
            {
              id: "app-2",
              petName: "Luna",
              applicantName: "Jane Smith",
              status: "APPROVED",
              submittedAt: "2026-06-02T11:00:00Z",
            },
          ],
          total: 2,
        });
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Buddy")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Use the list items to scope status badge assertions
    const buddyItem = screen.getByTestId("approval-item-app-1");
    expect(within(buddyItem).getByText("Pending")).toBeInTheDocument();

    const lunaItem = screen.getByTestId("approval-item-app-2");
    expect(within(lunaItem).getByText("Approved")).toBeInTheDocument();
  });

  // ── Tab switching ────────────────────────────────────────────────────────

  it("switches tabs and updates the API call with correct status param", async () => {
    const requestedStatuses: (string | null)[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        requestedStatuses.push(status);

        return HttpResponse.json({
          items: [
            {
              id: "app-tab",
              petName: "TabPet",
              applicantName: "TabUser",
              status: status || "ALL",
              submittedAt: "2026-06-01T10:00:00Z",
            },
          ],
          total: 1,
        });
      }),
    );

    renderPage();

    // Wait for initial load (no status param = "all" tab)
    await waitFor(() => expect(screen.getByText("TabPet")).toBeInTheDocument());
    expect(requestedStatuses).toHaveLength(1);
    expect(requestedStatuses[0]).toBeNull();

    // Click "Pending" tab
    const user = userEvent.setup();
    await user.click(screen.getByTestId("tab-PENDING"));

    await waitFor(() => {
      expect(requestedStatuses).toHaveLength(2);
      expect(requestedStatuses[1]).toBe("PENDING");
    });
  });

  // ── Tabs accessibility ───────────────────────────────────────────────────

  it("renders filter tabs with correct roles and aria-selected", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage();

    await waitFor(() => screen.getByTestId("tab-all"));

    const tablist = screen.getByRole("tablist", { name: /approval status filters/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);

    // "All" tab is selected by default
    expect(screen.getByTestId("tab-all")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("tab-PENDING")).toHaveAttribute("aria-selected", "false");
  });
});
