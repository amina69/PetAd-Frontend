import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SharePetButton } from "../SharePetButton";

describe("SharePetButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a Share button", () => {
    render(<SharePetButton petName="Luna" />);
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByText("Share")).toBeTruthy();
  });

  it("has accessible aria-label naming the pet", () => {
    render(<SharePetButton petName="Max" />);
    expect(screen.getByRole("button").getAttribute("aria-label")).toContain("Max");
  });

  it("button has aria-live='polite'", () => {
    render(<SharePetButton petName="Luna" />);
    expect(screen.getByRole("button").getAttribute("aria-live")).toBe("polite");
  });

  it("copies to clipboard and shows 'Link copied!' when navigator.share is absent", async () => {
    // Ensure navigator.share is undefined for this test
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SharePetButton petName="Buddy" url="https://example.com/buddy" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(writeText).toHaveBeenCalledWith("https://example.com/buddy");
    expect(screen.getByText("Link copied!")).toBeTruthy();
  });

  it("reverts label after 2 seconds", async () => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SharePetButton petName="Buddy" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByText("Link copied!")).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Share")).toBeTruthy();
  });

  it("calls navigator.share when it is available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      configurable: true,
    });

    render(<SharePetButton petName="Luna" url="https://example.com/luna" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com/luna" }),
    );
  });

  it("does not show 'Link copied!' when navigator.share succeeds", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });

    render(<SharePetButton petName="Luna" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.queryByText("Link copied!")).toBeNull();
  });
});
