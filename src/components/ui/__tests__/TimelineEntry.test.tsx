import { render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { AdoptionTimelineEntry } from "../../types/adoption";
import { TimelineEntry } from "../TimelineEntry";

const baseEntry: AdoptionTimelineEntry = {
  id: "1",
  adoptionId: "adoption-1",
  timestamp: "2024-03-26T10:00:00Z",
  sdkEvent: "ESCROW_CREATED",
  message: "Escrow created",
  actor: "John Doe",
  actorRole: "adopter",
  fromStatus: undefined,
  toStatus: "ESCROW_CREATED",
  reason: "Initial escrow setup",
};

const sdkTxEntry: AdoptionTimelineEntry = {
  ...baseEntry,
  id: "2",
  sdkEvent: "ESCROW_FUNDED",
  fromStatus: "ESCROW_CREATED",
  toStatus: "ESCROW_FUNDED",
  sdkTxHash: "abcd1234567890abcd1234567890abcd12345678",
  reason: "Funds deposited successfully",
};

const adminOverrideEntry: AdoptionTimelineEntry = {
  ...baseEntry,
  id: "3",
  sdkEvent: "FUNDS_RELEASED",
  fromStatus: "ESCROW_FUNDED",
  toStatus: "FUNDS_RELEASED",
  actor: "Admin User",
  actorRole: "administrator",
  isAdminOverride: true,
  reason: "Manual release due to completed custody",
};

describe("TimelineEntry", () => {
  beforeEach(() => {
    // Mock the current date to March 26, 2025 11:00 AM UTC (exactly 1 year + 1 hour after the test timestamp)
    // This ensures consistent snapshots regardless of when tests are run
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-26T11:00:00Z"));

    vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(function () {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it("renders regular entry correctly", () => {
    const { container } = render(<TimelineEntry entry={baseEntry} />);

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("(adopter)")).toBeTruthy();
    expect(screen.getByText("Initial escrow setup")).toBeTruthy();
    expect(screen.getByText("Escrow Created")).toBeTruthy();

    const timestamp = screen.getByText(/ago/);
    expect(timestamp).toBeTruthy();
    expect(timestamp).toHaveAttribute("title");

    expect(container.querySelector("[aria-label]")).toBeTruthy();

    expect(container).toMatchSnapshot();
  });

  it("renders SDK-driven entry with transaction link", () => {
    const { container } = render(<TimelineEntry entry={sdkTxEntry} />);

    expect(screen.getByText("Escrow Created")).toBeTruthy();
    expect(screen.getByText("Escrow Funded")).toBeTruthy();
    expect(screen.getByText("Funds deposited successfully")).toBeTruthy();

    // Check for Stellar transaction link
    const txLink = container.querySelector('a[href*="stellar"]');
    expect(txLink).toBeTruthy();

    expect(container).toMatchSnapshot();
  });

  it("renders admin override entry correctly", () => {
    const { container } = render(<TimelineEntry entry={adminOverrideEntry} />);

    expect(screen.getByText("Admin User")).toBeTruthy();
    expect(screen.getByText("(administrator)")).toBeTruthy();
    expect(
      screen.getByText("Manual release due to completed custody"),
    ).toBeTruthy();
    expect(screen.getByText("Admin override")).toBeTruthy();

    const adminBadge = screen.getByText("Admin override");
    expect(adminBadge.className).toContain("bg-amber-100");
    expect(adminBadge.className).toContain("text-amber-800");

    expect(container).toMatchSnapshot();
  });

  it("handles missing optional fields gracefully", () => {
    const minimalEntry: AdoptionTimelineEntry = {
      id: "4",
      adoptionId: "adoption-1",
      timestamp: "2024-03-26T10:00:00Z",
      sdkEvent: "ESCROW_CREATED",
      message: "Basic entry",
    };

    const { container } = render(<TimelineEntry entry={minimalEntry} />);

    // Should not show actor info if missing
    expect(screen.queryByText(/John Doe/)).toBeFalsy();
    expect(screen.queryByText(/\(adopter\)/)).toBeFalsy();

    // Should still show timestamp
    expect(screen.getByText(/ago/)).toBeTruthy();

    expect(container).toMatchSnapshot();
  });

  it("generates proper aria-label for accessibility", () => {
    const { container } = render(<TimelineEntry entry={adminOverrideEntry} />);

    const listItem = container.querySelector("li");
    const ariaLabel = listItem?.getAttribute("aria-label");

    expect(ariaLabel).toContain(
      "Status changed from ESCROW FUNDED to FUNDS RELEASED",
    );
    expect(ariaLabel).toContain("by Admin User (administrator)");
    expect(ariaLabel).toContain(
      "Reason: Manual release due to completed custody",
    );
    expect(ariaLabel).toContain("Admin override");
    expect(ariaLabel).toContain("at");
  });

  it("shows relative time with absolute time on hover", () => {
    const { container } = render(<TimelineEntry entry={baseEntry} />);

    const timeElement = container.querySelector("time");
    expect(timeElement).toBeTruthy();
    expect(timeElement).toHaveAttribute("dateTime", "2024-03-26T10:00:00Z");
    expect(timeElement).toHaveAttribute("title");

    // Title should contain absolute time
    const title = timeElement?.getAttribute("title");
    expect(title).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
