import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { petService } from "../../api/petService";
import { RecentlyViewed } from "../../components/home/RecentlyViewed";
import type { Pet } from "../../types/pet";
import {
  recordRecentlyViewedPet,
  useRecentlyViewed,
} from "../useRecentlyViewed";

vi.mock("../../api/petService", () => ({
  petService: {
    getPets: vi.fn(),
  },
}));

const STORAGE_KEY = "petad:recently-viewed-pets";
const getPetsMock = vi.mocked(petService.getPets);

function createTestProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function TestProviders({ children }: PropsWithChildren) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

function pet(id: number, status: string): Pet {
  return {
    id,
    name: `Pet ${id}`,
    species: "Dog",
    breed: "Mixed",
    age: "2 years",
    status,
    interests: 0,
    imageUrl: `/pets/${id}.jpg`,
  };
}

describe("recently viewed pets", () => {
  beforeEach(() => {
    localStorage.clear();
    getPetsMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores only the latest ten unique pet ids", () => {
    for (let id = 1; id <= 11; id += 1) {
      recordRecentlyViewedPet(String(id));
    }
    recordRecentlyViewedPet("5");

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual([
      "5",
      "11",
      "10",
      "9",
      "8",
      "7",
      "6",
      "4",
      "3",
      "2",
    ]);
  });

  it("fetches current pets and excludes adopted or removed listings", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["3", "2", "1", "removed"]),
    );
    getPetsMock.mockResolvedValue([
      pet(1, "Available"),
      pet(2, "ADOPTED"),
      pet(3, "Available"),
      pet(4, "Available"),
    ]);

    const { result } = renderHook(() => useRecentlyViewed(), {
      wrapper: createTestProviders(),
    });

    await waitFor(() => {
      expect(result.current.pets.map(({ id }) => id)).toEqual([3, 1]);
    });
    expect(getPetsMock).toHaveBeenCalledOnce();
  });

  it("does not throw when local storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    expect(() => recordRecentlyViewedPet("42")).not.toThrow();
    const { result } = renderHook(() => useRecentlyViewed(), {
      wrapper: createTestProviders(),
    });
    expect(() => result.current.clearRecentlyViewed()).not.toThrow();
  });

  it("hides when the API no longer returns any recently viewed pets", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["removed"]));
    getPetsMock.mockResolvedValue([]);

    render(<RecentlyViewed />, { wrapper: createTestProviders() });

    await waitFor(() => {
      expect(getPetsMock).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("region", { name: "Recently viewed" }),
      ).not.toBeInTheDocument();
    });
  });

  it("hides when no current pets remain and clears viewed ids", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["1"]));
    getPetsMock.mockResolvedValue([pet(1, "Available")]);

    render(<RecentlyViewed />, { wrapper: createTestProviders() });
    await screen.findByText("Pet 1");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("region", { name: "Recently viewed" }),
      ).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
