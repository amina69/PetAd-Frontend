import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import ApprovalListPage from "../ApprovalListPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Renders the current query string so tests can assert on URL state. */
function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location-search">{location.search}</div>
  );
}

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
        <LocationProbe />
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

/** Reads the current query string rendered by the location probe. */
function currentSearch(): string {
  return screen.getByTestId("location-search").textContent ?? "";
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

    renderPage(["/?status=pending"]);

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

    renderPage(["/?status=approved"]);

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

    renderPage(["/?status=rejected"]);

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
    await user.click(screen.getByTestId("tab-pending"));

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
    expect(screen.getByTestId("tab-pending")).toHaveAttribute("aria-selected", "false");
  });

  // ── URL state: status filter ─────────────────────────────────────────────

  it("writes the selected status filter to the URL", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("tab-pending"));

    await waitFor(() => {
      expect(currentSearch()).toContain("status=pending");
    });
  });

  it("writes the selected sort order to the URL", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByTestId("sort-select"), "date_asc");

    await waitFor(() => {
      expect(currentSearch()).toContain("sort=date_asc");
    });
  });

  it("writes the page number to the URL", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 13 });
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByTestId("approval-pagination")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByTestId("pagination-page-2"));

    await waitFor(() => {
      expect(currentSearch()).toContain("page=2");
    });
  });

  it("builds the documented URL shape (?status=…&sort=…&page=…)", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 13 });
      }),
    );

    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("tab-pending"));
    await user.selectOptions(screen.getByTestId("sort-select"), "date_desc");

    await waitFor(() => expect(screen.getByTestId("approval-pagination")).toBeInTheDocument());
    await user.click(screen.getByTestId("pagination-page-2"));

    await waitFor(() => {
      const params = new URLSearchParams(currentSearch());
      expect(params.get("status")).toBe("pending");
      expect(params.get("sort")).toBe("date_desc");
      expect(params.get("page")).toBe("2");
    });
  });

  // ── URL state: restore on hard refresh ───────────────────────────────────

  it("restores filter, sort and page from the URL on mount", async () => {
    const requestUrls: string[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        requestUrls.push(request.url);
        return HttpResponse.json({ items: [], total: 13 });
      }),
    );

    renderPage(["/?status=pending&sort=date_asc&page=2"]);

    // Controls reflect the URL
    await waitFor(() => {
      expect(screen.getByTestId("tab-pending")).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByTestId("sort-select")).toHaveValue("date_asc");

    await waitFor(() => expect(screen.getByTestId("pagination-page-2")).toBeInTheDocument());
    expect(screen.getByTestId("pagination-page-2")).toHaveAttribute("aria-current", "page");

    // The API request carries the same state
    await waitFor(() => expect(requestUrls.length).toBeGreaterThan(0));

    const params = new URL(requestUrls[0]).searchParams;
    expect(params.get("status")).toBe("PENDING");
    expect(params.get("sort")).toBe("date_asc");
    expect(params.get("page")).toBe("2");
  });

  it("ignores unknown status/sort values and falls back to the defaults", async () => {
    const requestUrls: string[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        requestUrls.push(request.url);
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage(["/?status=bogus&sort=bogus&page=0"]);

    await waitFor(() => expect(screen.getByText("No approval history yet")).toBeInTheDocument());

    expect(screen.getByTestId("tab-all")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("sort-select")).toHaveValue("date_desc");

    const params = new URL(requestUrls[0]).searchParams;
    expect(params.get("status")).toBeNull();
    expect(params.get("page")).toBe("1");
  });

  it("only accepts a plain positive integer for the page param", async () => {
    const requestUrls: string[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        requestUrls.push(request.url);
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );

    renderPage(["/?page=2abc"]);

    await waitFor(() => expect(screen.getByText("No approval history yet")).toBeInTheDocument());

    expect(new URL(requestUrls[0]).searchParams.get("page")).toBe("1");
  });

  // ── Sorting ──────────────────────────────────────────────────────────────

  it("sorts the rendered items by the selected order", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({
          items: [
            {
              id: "app-old",
              petName: "Oldest",
              applicantName: "Ann",
              status: "REJECTED",
              submittedAt: "2026-06-01T10:00:00Z",
            },
            {
              id: "app-new",
              petName: "Newest",
              applicantName: "Bob",
              status: "APPROVED",
              submittedAt: "2026-06-05T10:00:00Z",
            },
          ],
          total: 2,
        });
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("Oldest")).toBeInTheDocument());

    const readOrder = () =>
      Array.from(document.querySelectorAll('[role="listitem"]')).map(
        (node) => node.getAttribute("data-testid") ?? "",
      );

    // Default sort is "newest first"
    expect(readOrder()).toEqual(["approval-item-app-new", "approval-item-app-old"]);

    const user = userEvent.setup();
    await user.selectOptions(screen.getByTestId("sort-select"), "date_asc");

    await waitFor(() => {
      expect(readOrder()).toEqual(["approval-item-app-old", "approval-item-app-new"]);
    });
  });

  // ── Responsive grid ──────────────────────────────────────────────────────

  it("renders the approval list in a responsive grid (1 / 2 / 3 columns)", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({
          items: [
            {
              id: "app-grid",
              petName: "GridPet",
              applicantName: "GridUser",
              status: "PENDING",
              submittedAt: "2026-06-01T10:00:00Z",
            },
          ],
          total: 1,
        });
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByTestId("approval-grid")).toBeInTheDocument());

    const grid = screen.getByTestId("approval-grid");
    // Same Tailwind breakpoints as the pet listing page (sm / lg).
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
  });

  // ── Pagination ───────────────────────────────────────────────────────────

  it("resets to page 1 when the status filter changes", async () => {
    const requestedPages: (string | null)[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        requestedPages.push(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json({ items: [], total: 13 });
      }),
    );

    renderPage(["/?status=pending&sort=date_asc&page=2"]);

    await waitFor(() => expect(screen.getByTestId("approval-pagination")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByTestId("tab-approved"));

    await waitFor(() => {
      expect(currentSearch()).toContain("page=1");
    });
    expect(requestedPages).toContain("1");
  });

  it("falls back to the last valid page when the URL requests an out-of-range page", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return HttpResponse.json({ items: [], total: 13 });
      }),
    );

    renderPage(["/?page=99"]);

    await waitFor(() => {
      const params = new URLSearchParams(currentSearch());
      expect(params.get("page")).toBe("3");
    });
  });
});
