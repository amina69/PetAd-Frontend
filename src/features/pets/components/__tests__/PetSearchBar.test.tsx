import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PetSearchBar } from "../PetSearchBar";
import { petService } from "../../../../api/petService";
import type { Pet } from "../../../../types/pet";

vi.mock("../../../../api/petService");

const pets: Pet[] = [
  {
    id: 1,
    name: "Rex",
    species: "Dog",
    breed: "German Shepherd",
    age: "4yrs old",
    status: "Available",
    interests: 4,
    imageUrl: "/assets/dog.png",
  },
];

function renderBar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onPetsFetch = vi.fn();
  const onSearchChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <PetSearchBar onPetsFetch={onPetsFetch} onSearchChange={onSearchChange} />
    </QueryClientProvider>,
  );
  return { onPetsFetch, onSearchChange };
}

describe("PetSearchBar", () => {
  beforeEach(() => {
    vi.mocked(petService.searchPets).mockReset().mockResolvedValue(pets);
  });

  it("issues a single request for a fast burst of typing", async () => {
    const { onPetsFetch } = renderBar();
    const input = screen.getByLabelText("Search pets");

    ["g", "ge", "ger", "germ", "germa", "german"].forEach((value) => {
      fireEvent.change(input, { target: { value } });
    });

    expect(await screen.findByText("Rex")).toBeInTheDocument();
    expect(petService.searchPets).toHaveBeenCalledTimes(1);
    expect(petService.searchPets).toHaveBeenCalledWith("german");
    await waitFor(() => expect(onPetsFetch).toHaveBeenCalledWith(pets));
  });

  it("waits for the two-character minimum before searching", async () => {
    renderBar();
    fireEvent.change(screen.getByLabelText("Search pets"), { target: { value: "g" } });

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });

    expect(petService.searchPets).not.toHaveBeenCalled();
  });

  it("clears the query and resets to page 1 on Escape", async () => {
    const { onSearchChange } = renderBar();
    const input = screen.getByLabelText("Search pets");

    fireEvent.change(input, { target: { value: "german" } });
    await screen.findByText("Rex");

    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toHaveValue("");
    expect(onSearchChange).toHaveBeenLastCalledWith("", 1);
  });
});
