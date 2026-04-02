import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApprovalExpiryCountdown } from "../ApprovalExpiryCountdown";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an ISO string that is `offsetMs` milliseconds from Date.now(). */
function isoFromNow(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("ApprovalExpiryCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Color class thresholds ───────────────────────────────────────────────────

  it("applies slate color class when more than 24 h remain", () => {
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(MS.day + MS.hour)} />,
    );

    const el = screen.getByTestId("approval-expiry-countdown");
    expect(el.className).toContain("text-slate-600");
    expect(el.className).not.toContain("text-amber-500");
    expect(el.className).not.toContain("text-red-500");
  });

  it("applies amber color class when less than 24 h remain", () => {
    // 23 hours remaining → warning tier
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(23 * MS.hour)} />,
    );

    const el = screen.getByTestId("approval-expiry-countdown");
    expect(el.className).toContain("text-amber-500");
    expect(el.className).not.toContain("text-slate-600");
    expect(el.className).not.toContain("text-red-500");
  });

  it("applies red color class and shows urgency icon when less than 1 h remains", () => {
    // 30 minutes remaining → urgent tier
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(30 * MS.minute)} />,
    );

    const el = screen.getByTestId("approval-expiry-countdown");
    expect(el.className).toContain("text-red-500");
    expect(screen.getByTestId("urgency-icon")).toBeTruthy();
  });

  it("does NOT show the urgency icon in the warning tier (<24h but >=1h)", () => {
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(5 * MS.hour)} />,
    );

    expect(screen.queryByTestId("urgency-icon")).toBeNull();
  });

  // ── Expired state ────────────────────────────────────────────────────────────

  it("displays 'Expired' immediately when expiresAt is in the past", () => {
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(-MS.minute)} />,
    );

    expect(screen.getByTestId("approval-expiry-countdown").textContent).toBe(
      "Expired",
    );
  });

  it("transitions to 'Expired' state after the countdown reaches zero", () => {
    // Start with 2 minutes remaining.
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(2 * MS.minute)} />,
    );

    expect(
      screen.getByTestId("approval-expiry-countdown").textContent,
    ).not.toBe("Expired");

    // Advance time past the expiry point and trigger the interval tick.
    act(() => {
      vi.advanceTimersByTime(3 * MS.minute);
    });

    expect(screen.getByTestId("approval-expiry-countdown").textContent).toBe(
      "Expired",
    );
  });

  // ── Interval cleanup ─────────────────────────────────────────────────────────

  it("clears the interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(MS.day)} />,
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT start an interval when already expired on mount", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(-MS.minute)} />,
    );

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  // ── Label formatting ─────────────────────────────────────────────────────────

  it("shows hours and minutes when more than 60 min remain", () => {
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(90 * MS.minute)} />,
    );

    expect(
      screen.getByTestId("approval-expiry-countdown").textContent,
    ).toContain("1h 30m remaining");
  });

  it("shows only minutes when less than 60 min remain", () => {
    render(
      <ApprovalExpiryCountdown expiresAt={isoFromNow(45 * MS.minute)} />,
    );

    expect(
      screen.getByTestId("approval-expiry-countdown").textContent,
    ).toContain("45m remaining");
  });
});
