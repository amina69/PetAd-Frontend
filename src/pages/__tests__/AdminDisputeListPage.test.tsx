import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import AdminDisputeListPage from "../AdminDisputeListPage";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Two disputes: one SLA-breached (Max), one within SLA (Bella)

const DISPUTES = [
  {
    id: "dispute-aaa-001",
    pet: { id: "p1", name: "Max" },
    adopter: { id: "a1", name: "Alice Smith" },
    shelter: { id: "s1", name: "Happy Paws" },
    status: "open",
    isOverdue: true,
    createdAt: "2026-03-24T10:00:00.000Z",
    adoptionId: "a1",
    raisedBy: "a1",
    reason: "test",
    description: "test",
    evidence: [],
    timeline: [],
    resolution: null,
    updatedAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "dispute-bbb-002",
    pet: { id: "p2", name: "Bella" },
    adopter: { id: "a2", name: "Bob Johnson" },
    shelter: { id: "s2", name: "Rescue Dogs" },
    status: "resolved",
    isOverdue: false,
    createdAt: "2026-03-25T10:00:00.000Z",
    adoptionId: "a2",
    raisedBy: "a2",
    reason: "test",
    description: "test",
    evidence: [],
    timeline: [],
    resolution: null,
    updatedAt: "2026-03-25T10:00:00.000Z",
  },
  {
    id: "dispute-ccc-003",
    pet: { id: "p3", name: "Charlie" },
    adopter: { id: "a3", name: "Carol White" },
    shelter: { id: "s3", name: "Safe Haven" },
    status: "open",
    isOverdue: true,
    createdAt: "2026-03-26T10:00:00.000Z",
    adoptionId: "a3",
    raisedBy: "a3",
    reason: "test",
    description: "test",
    evidence: [],
    timeline: [],
    resolution: null,
    updatedAt: "2026-03-26T10:00:00.000Z",
  },
];

// Default handler: filters + cursor pagination (page size 2)
function makeDisputeHandler() {
  return http.get("/api/disputes", ({ request }) => {
    const url = new URL(request.url);
    const overdue = url.searchParams.get("overdue");
    const status = url.searchParams.get("status");
    const cursor = url.searchParams.get("cursor");

    let results = [...DISPUTES];
    if (status && status !== "all") results = results.filter((d) => d.status === status);
    if (overdue === "true") results = results.filter((d) => d.isOverdue);

    const pageSize = 2;
    let start = 0;
    if (cursor) {
      const idx = results.findIndex((d) => d.id === cursor);
      if (idx !== -1) start = idx + 1;
    }
    const data = results.slice(start, start + pageSize);
    const last = data[data.length - 1];
    const nextCursor = start + pageSize < results.length && last ? last.id : undefined;

    return HttpResponse.json({ data, nextCursor });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/disputes"]}>
        <AdminDisputeListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminDisputeListPage", () => {
  beforeEach(() => {
    // Override the global MSW handler with our controlled test data
    server.use(makeDisputeHandler());
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText(/Disputes Administration/i)).toBeInTheDocument();
  });

  it("renders the table with initial disputes", async () => {
    renderPage();
    expect(await screen.findByText("Max")).toBeInTheDocument();
    expect(await screen.findByText("Bella")).toBeInTheDocument();
  });

  it("renders all required columns in the table header", async () => {
    renderPage();
    await screen.findByText("Max");
    // "Status" appears in both the filter label and the table header — use getAllByText
    for (const col of ["ID", "Raised Date", "Pet", "Adopter", "Shelter", "SLA"]) {
      expect(screen.getByText(col)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Status").length).toBeGreaterThanOrEqual(1);
  });

  it("renders DisputeStatusBadge and DisputeSLABadge for each row", async () => {
    renderPage();
    await screen.findByText("Max");
    expect(screen.getAllByTestId("dispute-status-badge").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("dispute-sla-badge").length).toBeGreaterThanOrEqual(1);
  });

  // ── SLA filter ─────────────────────────────────────────────────────────────

  it("SLA filter toggle is visible and prominent", () => {
    renderPage();
    expect(screen.getByTestId("sla-filter-toggle")).toBeInTheDocument();
    expect(screen.getByText(/SLA Breached Only/i)).toBeInTheDocument();
  });

  it("SLA filter shows only breached items when toggled on", async () => {
    renderPage();
    await screen.findByText("Max");
    expect(screen.getByText("Bella")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sla-filter-toggle"));

    await waitFor(() => {
      expect(screen.queryByText("Bella")).not.toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
    });

    // All visible SLA badges should be "SLA Breached"
    screen.getAllByTestId("dispute-sla-badge").forEach((badge) => {
      expect(badge.textContent).toContain("SLA Breached");
    });
  });

  it("SLA filter toggle reflects aria-checked state", async () => {
    renderPage();
    await screen.findByText("Max");

    const toggle = screen.getByTestId("sla-filter-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  // ── Status filter ──────────────────────────────────────────────────────────

  it("status filter narrows results to the selected status", async () => {
    renderPage();
    await screen.findByText("Max");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "resolved" } });

    await waitFor(() => {
      expect(screen.queryByText("Max")).not.toBeInTheDocument();
      expect(screen.getByText("Bella")).toBeInTheDocument();
    });
  });

  // ── Empty state per filter combination ────────────────────────────────────

  it("shows empty state when status filter yields no results", async () => {
    renderPage();
    await screen.findByText("Max");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "closed" } });

    await waitFor(() => {
      expect(screen.queryByText("Max")).not.toBeInTheDocument();
      expect(screen.getByText(/No "closed" disputes/i)).toBeInTheDocument();
    });
  });

  it("shows SLA-specific empty state when SLA filter yields no results", async () => {
    // Override: return empty list for overdue=true
    server.use(
      http.get("/api/disputes", ({ request }) => {
        const url = new URL(request.url);
        const overdue = url.searchParams.get("overdue");
        const data = overdue === "true" ? [] : DISPUTES.slice(0, 2);
        return HttpResponse.json({ data });
      }),
    );

    renderPage();
    await screen.findByText("Max");

    fireEvent.click(screen.getByTestId("sla-filter-toggle"));

    await waitFor(() => {
      expect(screen.getByText(/No SLA-breached disputes/i)).toBeInTheDocument();
    });
  });

  it("shows combined empty state for status + SLA filter with no results", async () => {
    renderPage();
    await screen.findByText("Max");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "closed" } });
    fireEvent.click(screen.getByTestId("sla-filter-toggle"));

    await waitFor(() => {
      expect(screen.getByText(/No breached "closed" disputes/i)).toBeInTheDocument();
    });
  });

  // ── Cursor pagination ──────────────────────────────────────────────────────

  it("shows Load more button when there is a next page", async () => {
    renderPage();
    await screen.findByText("Max");
    expect(screen.getByTestId("load-more")).toBeInTheDocument();
  });

  it("loads next page when Load more is clicked", async () => {
    renderPage();
    await screen.findByText("Max");

    fireEvent.click(screen.getByTestId("load-more"));

    await waitFor(() => {
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
  });

  it("hides Load more when all pages are loaded", async () => {
    renderPage();
    await screen.findByText("Max");

    fireEvent.click(screen.getByTestId("load-more"));
    await screen.findByText("Charlie");

    await waitFor(() => {
      expect(screen.queryByTestId("load-more")).not.toBeInTheDocument();
    });
  });

  // ── Row accessibility ──────────────────────────────────────────────────────

  it("each row has role=button and is keyboard accessible", async () => {
    renderPage();
    await screen.findByText("Max");

    screen.getAllByTestId("dispute-row").forEach((row) => {
      expect(row).toHaveAttribute("role", "button");
      expect(row).toHaveAttribute("tabindex", "0");
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it("shows error banner and retry button on fetch failure", async () => {
    server.use(
      http.get("/api/disputes", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load disputes/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });
});
