import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { StatusBadge } from "../StatusBadge";

const COLOR_VARIANTS = [
  { color: "gray", variantClass: "status-badge--gray" },
  { color: "blue", variantClass: "status-badge--blue" },
  { color: "teal", variantClass: "status-badge--teal" },
  { color: "green", variantClass: "status-badge--green" },
  { color: "amber", variantClass: "status-badge--amber" },
  { color: "red", variantClass: "status-badge--red" },
] as const;

describe("StatusBadge", () => {
  it.each(COLOR_VARIANTS)("applies $variantClass for $color", ({ color, variantClass }) => {
    renderWithProviders(<StatusBadge color={color} label={`Badge ${color}`} />);

    const labelNode = screen.getByText(`Badge ${color}`);
    const pill = labelNode.closest(".status-badge") as HTMLElement | null;

    expect(pill).toBeTruthy();
    expect(pill?.className).toContain(variantClass);
  });

  it("adds pulse class when pulse is enabled", () => {
    renderWithProviders(<StatusBadge color="red" label="SLA breached" pulse />);

    const labelNode = screen.getByText("SLA breached");
    const pill = labelNode.closest(".status-badge") as HTMLElement | null;

    expect(pill).toBeTruthy();
    expect(pill?.className).toContain("status-badge--pulse");
  });
});
