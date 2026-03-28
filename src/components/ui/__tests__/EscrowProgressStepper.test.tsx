import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EscrowProgressStepper } from "../EscrowProgressStepper";

function snapshotSteps(currentStatus: Parameters<typeof EscrowProgressStepper>[0]["currentStatus"]) {
  const { unmount } = render(
    <EscrowProgressStepper currentStatus={currentStatus} />
  );

  const steps = within(
    screen.getByRole("list", { name: "Escrow settlement progress" })
  )
    .getAllByRole("listitem")
    .map((step) => {
      const lines = within(step).getAllByText(
        (_content, element) => element?.tagName.toLowerCase() === "p"
      );

      return {
        label: lines[0]?.textContent,
        summary: lines[1]?.textContent,
        current: step.getAttribute("aria-current") === "step",
      };
    });

  unmount();
  return steps;
}

describe("EscrowProgressStepper", () => {
  it("matches the escrow created snapshot", () => {
    expect(snapshotSteps("ESCROW_CREATED")).toMatchInlineSnapshot(`
      [
        {
          "current": true,
          "label": "Escrow Created",
          "summary": "Current step",
        },
        {
          "current": false,
          "label": "Escrow Funded",
          "summary": "Upcoming",
        },
        {
          "current": false,
          "label": "Settlement Triggered",
          "summary": "Upcoming",
        },
        {
          "current": false,
          "label": "Funds Released",
          "summary": "Upcoming",
        },
      ]
    `);
  });

  it("matches the escrow funded snapshot", () => {
    expect(snapshotSteps("ESCROW_FUNDED")).toMatchInlineSnapshot(`
      [
        {
          "current": false,
          "label": "Escrow Created",
          "summary": "Completed",
        },
        {
          "current": true,
          "label": "Escrow Funded",
          "summary": "Current step",
        },
        {
          "current": false,
          "label": "Settlement Triggered",
          "summary": "Upcoming",
        },
        {
          "current": false,
          "label": "Funds Released",
          "summary": "Upcoming",
        },
      ]
    `);
  });

  it("matches the settlement triggered snapshot", () => {
    expect(snapshotSteps("SETTLEMENT_TRIGGERED")).toMatchInlineSnapshot(`
      [
        {
          "current": false,
          "label": "Escrow Created",
          "summary": "Completed",
        },
        {
          "current": false,
          "label": "Escrow Funded",
          "summary": "Completed",
        },
        {
          "current": true,
          "label": "Settlement Triggered",
          "summary": "Current step",
        },
        {
          "current": false,
          "label": "Funds Released",
          "summary": "Upcoming",
        },
      ]
    `);
  });

  it("matches the disputed snapshot", () => {
    expect(snapshotSteps("DISPUTED")).toMatchInlineSnapshot(`
      [
        {
          "current": false,
          "label": "Escrow Created",
          "summary": "Completed",
        },
        {
          "current": false,
          "label": "Escrow Funded",
          "summary": "Completed",
        },
        {
          "current": true,
          "label": "Dispute in Progress",
          "summary": "Current step",
        },
        {
          "current": false,
          "label": "Funds Released",
          "summary": "Upcoming",
        },
      ]
    `);
  });

  it("matches the funds released snapshot", () => {
    expect(snapshotSteps("FUNDS_RELEASED")).toMatchInlineSnapshot(`
      [
        {
          "current": false,
          "label": "Escrow Created",
          "summary": "Completed",
        },
        {
          "current": false,
          "label": "Escrow Funded",
          "summary": "Completed",
        },
        {
          "current": false,
          "label": "Settlement Triggered",
          "summary": "Completed",
        },
        {
          "current": true,
          "label": "Funds Released",
          "summary": "Current step",
        },
      ]
    `);
  });

  it("marks the active step with aria-current", () => {
    render(<EscrowProgressStepper currentStatus="SETTLEMENT_TRIGGERED" />);

    const activeStep = screen.getByText("Settlement Triggered").closest("li");

    expect(activeStep?.getAttribute("aria-current")).toBe("step");
  });

  it("shows the dispute interstitial only for disputed status", () => {
    const { rerender } = render(
      <EscrowProgressStepper currentStatus="DISPUTED" />
    );

    expect(screen.getByText("Dispute in Progress")).toBeTruthy();

    rerender(<EscrowProgressStepper currentStatus="FUNDS_RELEASED" />);

    expect(screen.queryByText("Dispute in Progress")).toBeNull();
  });
});
