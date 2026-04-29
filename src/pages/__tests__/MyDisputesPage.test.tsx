import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import MyDisputesPage from "../MyDisputesPage";

const populatedDisputes = [
  {
    id: "dispute-1",
    adoptionId: "adoption-1",
    raisedBy: "adopter-1",
    reason: "misrepresentation",
    description: "Health issue not disclosed",
    status: "open",
    isOverdue: false,
    pet: { id: "pet-1", name: "Max" },
    adopter: { id: "adopter-1", name: "Alice" },
    shelter: { id: "shelter-1", name: "Happy Paws Shelter" },
    evidence: [],
    timeline: [],
    resolution: null,
    createdAt: "2026-03-24T10:00:00.000Z",
    updatedAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "dispute-2",
    adoptionId: "adoption-2",
    raisedBy: "shelter-2",
    reason: "handover_issue",
    description: "Adopter did not show up",
    status: "under_review",
    isOverdue: false,
    pet: { id: "pet-2", name: "Bella" },
    adopter: { id: "adopter-2", name: "Bob" },
    shelter: { id: "shelter-2", name: "Rescue Dogs" },
    evidence: [],
    timeline: [],
    resolution: null,
    createdAt: "2026-03-25T10:00:00.000Z",
    updatedAt: "2026-03-25T10:00:00.000Z",
  },
];

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/disputes"]}>
        <Routes>
          <Route path="/disputes" element={<MyDisputesPage />} />
          <Route path="/disputes/:id" element={<div>Dispute detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MyDisputesPage", () => {
  beforeEach(() => {
    server.use(
      http.get("*/disputes", () => {
        return HttpResponse.json({
          data: populatedDisputes,
        });
      })
    );
  });

  it("renders the disputes list", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("dispute-1")).toBeTruthy();
    });

    expect(screen.getByText("Max")).toBeTruthy();
    expect(screen.getByText("Happy Paws Shelter")).toBeTruthy();
    expect(screen.getByText("Bella")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders empty state when user has no disputes", async () => {
    server.use(
      http.get("*/disputes", () => {
        return HttpResponse.json({
          data: [],
        });
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("No disputes filed")).toBeTruthy();
    });
  });
});
