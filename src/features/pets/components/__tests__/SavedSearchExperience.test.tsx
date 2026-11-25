import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { SaveSearchButton } from "../SaveSearchButton";
import { SavedSearchesPage } from "../SavedSearchesPage";
import {
  SAVED_SEARCH_LIMIT,
  SAVED_SEARCHES_STORAGE_KEY,
} from "../../hooks/useSavedSearches";

describe("saved search experience", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("runs a legacy search after dropping an outdated filter", () => {
    localStorage.setItem(
      SAVED_SEARCHES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy",
          name: "Old category",
          createdAt: 1,
          params: { location: "Ikeja", category: "rabbit", radius: 25 },
        },
      ]),
    );

    render(
      <MemoryRouter>
        <SavedSearchesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Run" })).toHaveAttribute(
      "href",
      "/home?location=Ikeja&radius=25",
    );
  });

  it("explains the ten-search limit and disables saving when full", () => {
    localStorage.setItem(
      SAVED_SEARCHES_STORAGE_KEY,
      JSON.stringify(
        Array.from({ length: SAVED_SEARCH_LIMIT }, (_, index) => ({
          id: `search-${index}`,
          name: `Search ${index}`,
          createdAt: index,
          params: {},
        })),
      ),
    );

    render(<SaveSearchButton params={{ category: "cat" }} />);

    expect(screen.getByRole("button", { name: "Save search" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "You can save up to 10 searches. Delete one to save another.",
    );
  });
});
