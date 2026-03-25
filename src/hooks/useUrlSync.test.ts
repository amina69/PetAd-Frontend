import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUrlSync } from "./useUrlSync";

describe("useUrlSync", () => {
  it("reads initial state from URL", () => {
    window.history.pushState({}, "", "/?status=OPEN&status=PENDING");

    const { result } = renderHook(() =>
      useUrlSync<{ status: string[] }>({ status: [] }),
    );

    expect(result.current[0].status).toEqual(["OPEN", "PENDING"]);
  });

  it("updates URL when state changes", () => {
    const { result } = renderHook(() =>
      useUrlSync<{ status: string[] }>({ status: [] }),
    );

    act(() => {
      result.current[1]({ status: ["OPEN"] });
    });

    expect(window.location.search).toContain("status=OPEN");
  });

  it("restores state on browser back", () => {
    // Step 1: start with empty URL
    window.history.pushState({}, "", "/");

    const { result } = renderHook(() =>
      useUrlSync<{ status: string[] }>({ status: [] }),
    );

    // Step 2: update state (sets ?status=OPEN)
    act(() => {
      result.current[1]({ status: ["OPEN"] });
    });

    // Step 3: simulate going back to empty URL
    window.history.replaceState({}, "", "/");

    // Step 4: trigger popstate
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0].status).toEqual([]);
  });
});
