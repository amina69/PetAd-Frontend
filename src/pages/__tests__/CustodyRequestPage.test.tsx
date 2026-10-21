import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CustodyRequestPage from "../CustodyRequestPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPage(petId = "pet-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/pets/${petId}/custody/new`]}>
        <Routes>
          <Route path="/pets/:petId/custody/new" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(<CustodyRequestPage />, { wrapper });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("CustodyRequestPage", () => {
  it("loads the pet and renders the request form", async () => {
    renderPage();

    expect(await screen.findByTestId("custody-request-form")).toBeInTheDocument();
    expect(screen.getByTestId("custody-pet-summary")).toHaveTextContent(
      "Buddy",
    );
  });

  it("explains when the pet could not be loaded", async () => {
    renderPage("pet-does-not-exist");

    expect(
      await screen.findByText("We could not load that pet"),
    ).toBeInTheDocument();
  });
});
