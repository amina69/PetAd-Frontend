import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../mocks/server";
import InterestPage from "../interestPage";
import type { AdoptionRequest } from "../../types/adoption";

const MOCK_REQUESTS: AdoptionRequest[] = [
  {
    id: "adoption-1",
    status: "DISPUTED",
    petId: "pet-1",
    petName: "Buddy",
    petBreed: "Dog, German Shepherd",
    petAge: "4 years old",
    petImageUrl: "https://images.example.com/buddy.jpg",
    adopterId: "user-1",
    adopterName: "Angela Christopher",
    location: "Lekki, Lagos",
    createdAt: "2026-03-20T08:00:00.000Z",
    updatedAt: "2026-03-22T09:30:00.000Z",
  },
  {
    id: "adoption-2",
    status: "DISPUTED",
    petId: "pet-2",
    petName: "Milo",
    petBreed: "Cat, Persian",
    petAge: "2 years old",
    petImageUrl: "https://images.example.com/milo.jpg",
    adopterId: "user-2",
    adopterName: "Tobi Lawson",
    location: "Yaba, Lagos",
    createdAt: "2026-03-18T10:00:00.000Z",
    updatedAt: "2026-03-21T10:30:00.000Z",
  },
  {
    id: "adoption-3",
    status: "DISPUTED",
    petId: "pet-3",
    petName: "Kiwi",
    petBreed: "Parrot, African Grey",
    petAge: "1 year old",
    petImageUrl: "https://images.example.com/kiwi.jpg",
    adopterId: "user-3",
    adopterName: "Samuel Ade",
    location: "Ikeja, Lagos",
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-03-19T09:45:00.000Z",
  },
  {
    id: "adoption-4",
    status: "ESCROW_FUNDED",
    petId: "pet-4",
    petName: "Luna",
    petBreed: "Dog, Husky",
    petAge: "3 years old",
    petImageUrl: "https://images.example.com/luna.jpg",
    adopterId: "user-4",
    adopterName: "Mercy Bello",
    location: "Abuja",
    createdAt: "2026-03-16T11:00:00.000Z",
    updatedAt: "2026-03-20T07:15:00.000Z",
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InterestPage />
    </QueryClientProvider>,
  );
}

describe("InterestPage status filters", () => {
  it("changes the adoption list query and updates the URL when a filter chip is clicked", async () => {
    const requestedStatuses: string[][] = [];

    window.history.pushState({}, "", "/interests");

    server.use(
      http.get("http://localhost:3000/api/adoption/requests", ({ request }) => {
        const statuses = new URL(request.url).searchParams.getAll("status");
        requestedStatuses.push(statuses);

        const filteredRequests = statuses.length
          ? MOCK_REQUESTS.filter((item) => statuses.includes(item.status))
          : MOCK_REQUESTS;

        return HttpResponse.json(filteredRequests);
      }),
    );

    renderPage();

    await screen.findByText("Buddy");

    await waitFor(() => {
      expect(requestedStatuses.at(-1)).toEqual([]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Disputed" }));

    await waitFor(() => {
      expect(requestedStatuses.at(-1)).toEqual(["DISPUTED"]);
    });

    await screen.findByRole("button", { name: "Disputed (3)" });
    expect(window.location.search).toContain("status=DISPUTED");
  });
});
