import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { CustodyStatusBadge } from "../CustodyStatusBadge";

const cases = [
  { status: "PENDING", label: "Pending", variantClass: "status-badge--gray" },
  {
    status: "DEPOSIT_PENDING",
    label: "Deposit Pending",
    variantClass: "status-badge--blue",
  },
  {
    status: "DEPOSIT_CONFIRMED",
    label: "Deposit Confirmed",
    variantClass: "status-badge--teal",
  },
  { status: "ACTIVE", label: "Active", variantClass: "status-badge--green" },
  {
    status: "EXPIRING_SOON",
    label: "Expiring Soon",
    variantClass: "status-badge--amber",
  },
  {
    status: "COMPLETING",
    label: "Completing",
    variantClass: "status-badge--amber",
  },
  { status: "COMPLETED", label: "Completed", variantClass: "status-badge--green" },
  { status: "DISPUTED", label: "Disputed", variantClass: "status-badge--red" },
  { status: "CANCELLED", label: "Cancelled", variantClass: "status-badge--gray" },
] as const;

describe("CustodyStatusBadge", () => {
  it.each(cases)("renders $status correctly", ({ status, label, variantClass }) => {
    const { container } = renderWithProviders(<CustodyStatusBadge status={status} />);

    const labelNode = screen.getByText(label);
    const pill = labelNode.closest(".status-badge") as HTMLElement | null;
    expect(pill).toBeTruthy();
    expect(pill?.className).toContain(variantClass);

    const tooltip = container.querySelector(".status-badge__tooltip");
    expect(tooltip).not.toBeNull();

    expect(container).toMatchSnapshot();
  });

  it("renders warning icon for EXPIRING_SOON", () => {
    const { container } = renderWithProviders(<CustodyStatusBadge status="EXPIRING_SOON" />);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
  });

  it("fallback works", () => {
    renderWithProviders(<CustodyStatusBadge status="UNKNOWN" />);
    expect(screen.getByText("Not Found")).toBeTruthy();
  });
});
