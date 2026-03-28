import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustodyStatusBadge } from "../CustodyStatusBadge";

const cases = [
  { status: "PENDING", label: "Pending", textClass: "text-gray-700" },
  {
    status: "DEPOSIT_PENDING",
    label: "Deposit Pending",
    textClass: "text-blue-700",
  },
  {
    status: "DEPOSIT_CONFIRMED",
    label: "Deposit Confirmed",
    textClass: "text-teal-700",
  },
  { status: "ACTIVE", label: "Active", textClass: "text-green-700" },
  {
    status: "EXPIRING_SOON",
    label: "Expiring Soon",
    textClass: "text-amber-700",
  },
  {
    status: "COMPLETING",
    label: "Completing",
    textClass: "text-amber-700",
  },
  { status: "COMPLETED", label: "Completed", textClass: "text-green-700" },
  { status: "DISPUTED", label: "Disputed", textClass: "text-red-700" },
  { status: "CANCELLED", label: "Cancelled", textClass: "text-gray-700" },
] as const;

describe("CustodyStatusBadge", () => {
  it.each(cases)("renders $status correctly", ({ status, label, textClass }) => {
    const { container } = render(<CustodyStatusBadge status={status} />);

    const pill = screen.getByText(label);
    expect(pill).toBeTruthy();
    expect(pill.className).toContain(textClass);

    const tooltip = container.querySelector('[class*="rounded-md"]');
    expect(tooltip).not.toBeNull();

    expect(container).toMatchSnapshot();
  });

  it("renders warning icon for EXPIRING_SOON", () => {
    const { container } = render(<CustodyStatusBadge status="EXPIRING_SOON" />);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
  });

  it("fallback works", () => {
    render(<CustodyStatusBadge status="UNKNOWN" />);
    expect(screen.getByText("Not Found")).toBeTruthy();
  });
});
