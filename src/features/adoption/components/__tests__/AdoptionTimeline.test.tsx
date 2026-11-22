import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdoptionTimeline } from "../AdoptionTimeline";

describe("AdoptionTimeline", () => {
  it("renders all four timeline steps from statusConfig", () => {
    render(<AdoptionTimeline status="PENDING" />);

    expect(screen.getByTestId("timeline-step-inquiry")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-step-review")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-step-approved")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-step-completed")).toBeInTheDocument();
  });

  it("marks the step matching the current status as current", () => {
    render(<AdoptionTimeline status="PENDING" />);

    expect(screen.getByTestId("timeline-step-inquiry")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(screen.getByTestId("timeline-step-review")).toHaveAttribute(
      "data-state",
      "current",
    );
    expect(screen.getByTestId("timeline-step-approved")).toHaveAttribute(
      "data-state",
      "upcoming",
    );
  });

  it("marks every step complete when the adoption is COMPLETED", () => {
    render(<AdoptionTimeline status="COMPLETED" />);

    for (const step of ["inquiry", "review", "approved", "completed"] as const) {
      expect(screen.getByTestId(`timeline-step-${step}`)).toHaveAttribute(
        "data-state",
        "complete",
      );
    }
  });

  describe("rejected status (acceptance criterion)", () => {
    it("shows the decision reason when one was provided", () => {
      render(
        <AdoptionTimeline
          status="REJECTED"
          decisionReason="The adopter could not provide a verified veterinary reference."
        />,
      );

      const reason = screen.getByTestId("decision-reason");
      expect(reason).toBeInTheDocument();
      expect(reason).toHaveTextContent(
        "The adopter could not provide a verified veterinary reference.",
      );
      expect(reason).toHaveTextContent("Reason for rejection");
    });

    it("does not render an empty reason box when no reason was provided", () => {
      render(<AdoptionTimeline status="REJECTED" />);

      expect(screen.queryByTestId("decision-reason")).not.toBeInTheDocument();
    });

    it("does not render the reason box for non-rejected statuses", () => {
      render(
        <AdoptionTimeline status="PENDING" decisionReason="Should be ignored" />,
      );

      expect(screen.queryByTestId("decision-reason")).not.toBeInTheDocument();
    });

    it("stops the timeline at the review step when rejected", () => {
      render(
        <AdoptionTimeline status="REJECTED" decisionReason="Incomplete." />,
      );

      expect(screen.getByTestId("timeline-step-review")).toHaveAttribute(
        "data-state",
        "rejected",
      );
      expect(screen.getByTestId("timeline-step-approved")).toHaveAttribute(
        "data-state",
        "upcoming",
      );
    });
  });
});
