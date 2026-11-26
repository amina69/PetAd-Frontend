import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  parseSavedSearches,
  SAVED_SEARCH_LIMIT,
  SAVED_SEARCHES_STORAGE_KEY,
  useSavedSearches,
} from "../useSavedSearches";

describe("saved searches", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("drops stale filter values while loading a saved search", () => {
    const searches = parseSavedSearches(
      JSON.stringify([
        {
          id: "legacy",
          name: "Older filter",
          createdAt: 1,
          params: {
            location: "Ikeja",
            category: "rabbit",
            radius: 25,
            latitude: 6.6,
            longitude: 3.3,
          },
        },
      ]),
    );

    expect(searches[0].params).toEqual({
      location: "Ikeja",
      radius: 25,
      latitude: 6.6,
      longitude: 3.3,
    });
  });

  it("enforces the saved search limit with an explicit result", () => {
    const { result } = renderHook(() => useSavedSearches());
    let saveResult = "saved";

    act(() => {
      for (let index = 0; index < SAVED_SEARCH_LIMIT; index += 1) {
        saveResult = result.current.save(`Search ${index}`, { category: "dog" });
      }
    });

    expect(result.current.atLimit).toBe(true);
    expect(
      result.current.save("One too many", { category: "cat" }),
    ).toBe("limit");
    expect(JSON.parse(localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY) ?? "[]")).toHaveLength(
      SAVED_SEARCH_LIMIT,
    );
    expect(saveResult).toBe("saved");
  });
});
