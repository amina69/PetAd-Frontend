import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CustodyExpiringBanner } from "../CustodyExpiringBanner";

function renderBanner(endDate: string, custodyId = "custody-123") {
  return render(
    <MemoryRouter>
      <CustodyExpiringBanner endDate={endDate} custodyId={custodyId} />
    </MemoryRouter>,
  );
}

describe("CustodyExpiringBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the banner when end date is in the future", () => {
      const endDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5 hours from now
      renderBanner(endDate);
      expect(screen.getByTestId("custody-expiring-banner")).toBeInTheDocument();
    });

    it("does not render when end date is in the past (expired)", () => {
      const endDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      renderBanner(endDate);
      expect(screen.queryByTestId("custody-expiring-banner")).not.toBeInTheDocument();
    });

    it("has role=alert for accessibility", () => {
      const endDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      renderBanner(endDate);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("is NOT dismissible (no dismiss button)", () => {
      const endDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      renderBanner(endDate);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("time display", () => {
    it("shows hours and minutes remaining when >= 1 hour left", () => {
      // 2 hours and 30 minutes from now
      const endDate = new Date(Date.now() + (2 * 60 + 30) * 60 * 1000).toISOString();
      renderBanner(endDate);
      const timeEl = screen.getByTestId("custody-time-remaining");
      expect(timeEl).toHaveTextContent("2 hours 30 minutes");
    });

    it("shows only hours when minutes remainder is 0", () => {
      const endDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      renderBanner(endDate);
      const timeEl = screen.getByTestId("custody-time-remaining");
      expect(timeEl).toHaveTextContent("3 hours");
      expect(timeEl).not.toHaveTextContent("minute");
    });

    it("shows minutes only when less than 1 hour remaining", () => {
      const endDate = new Date(Date.now() + 45 * 60 * 1000).toISOString(); // 45 minutes
      renderBanner(endDate);
      const timeEl = screen.getByTestId("custody-time-remaining");
      expect(timeEl).toHaveTextContent("45 minutes");
    });

    it("uses singular 'hour' and 'minute' when values are 1", () => {
      const endDate = new Date(Date.now() + (1 * 60 + 1) * 60 * 1000).toISOString();
      renderBanner(endDate);
      const timeEl = screen.getByTestId("custody-time-remaining");
      expect(timeEl).toHaveTextContent("1 hour 1 minute");
    });
  });

  describe("action link", () => {
    it("renders a link to the complete action for the correct custodyId", () => {
      const endDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      renderBanner(endDate, "cust-abc");
      const link = screen.getByTestId("custody-expiring-action-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/custody/cust-abc/complete");
    });
  });

  describe("interval updates", () => {
    it("updates the displayed time every 60 seconds", () => {
      // Start with 2 hours exactly
      const baseMs = Date.now();
      const endDate = new Date(baseMs + 2 * 60 * 60 * 1000).toISOString();

      renderBanner(endDate);
      expect(screen.getByTestId("custody-time-remaining")).toHaveTextContent("2 hours");

      // Advance by 61 minutes — should now show 59 minutes remaining
      act(() => {
        vi.advanceTimersByTime(61 * 60 * 1000);
      });

      const timeEl = screen.getByTestId("custody-time-remaining");
      expect(timeEl).toHaveTextContent("59 minutes");
    });

    it("cleans up interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
      const endDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

      const { unmount } = renderBanner(endDate);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
