import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustodyCard, getCustodyPerspective } from "../CustodyCard";
import type { CustodyArrangement } from "../../types/custody";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ARRANGEMENT: CustodyArrangement = {
  id: "custody-1",
  petId: "pet-1",
  ownerId: "user-1",
  caretakerId: "user-2",
  startDate: "2026-06-10",
  endDate: "2026-06-20",
  status: "active",
  notes: null,
  escrowStatus: "FUNDED",
  petName: "Buddy",
  ownerName: "Sam Smith",
  caretakerName: "Jane Doe",
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("CustodyCard", () => {
  it("shows the pet, the dates and the status", () => {
    render(<CustodyCard arrangement={ARRANGEMENT} today="2026-06-15" />);

    expect(screen.getByText("Buddy")).toBeInTheDocument();
    expect(screen.getByText("10 Jun 2026")).toBeInTheDocument();
    expect(screen.getByText("20 Jun 2026")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows the number of days left", () => {
    render(<CustodyCard arrangement={ARRANGEMENT} today="2026-06-15" />);

    expect(screen.getByTestId("custody-card-days-custody-1")).toHaveTextContent(
      "5 days left",
    );
  });

  it("counts down to the start of an arrangement that has not begun", () => {
    render(<CustodyCard arrangement={ARRANGEMENT} today="2026-06-01" />);

    expect(screen.getByTestId("custody-card-days-custody-1")).toHaveTextContent(
      "Starts in 9 days",
    );
  });

  it("reports how long ago an arrangement ended", () => {
    render(<CustodyCard arrangement={ARRANGEMENT} today="2026-06-25" />);

    expect(screen.getByTestId("custody-card-days-custody-1")).toHaveTextContent(
      "Ended 5 days ago",
    );
  });

  it("labels the caretaker for an owner", () => {
    render(
      <CustodyCard arrangement={ARRANGEMENT} viewerId="user-1" today="2026-06-15" />,
    );

    expect(screen.getByText("Caretaker")).toBeInTheDocument();
    expect(screen.getByTestId("custody-card-counterpart-custody-1")).toHaveTextContent(
      "Jane Doe",
    );
    expect(screen.getByTestId("custody-card-perspective-custody-1")).toHaveTextContent(
      "You are the owner",
    );
  });

  it("labels the owner for a caretaker", () => {
    render(
      <CustodyCard arrangement={ARRANGEMENT} viewerId="user-2" today="2026-06-15" />,
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByTestId("custody-card-counterpart-custody-1")).toHaveTextContent(
      "Sam Smith",
    );
    expect(screen.getByTestId("custody-card-perspective-custody-1")).toHaveTextContent(
      "You are the caretaker",
    );
  });

  it("stays neutral for a viewer who is neither party", () => {
    render(
      <CustodyCard arrangement={ARRANGEMENT} viewerId="user-9" today="2026-06-15" />,
    );

    expect(screen.getByText("Caretaker")).toBeInTheDocument();
    expect(
      screen.queryByTestId("custody-card-perspective-custody-1"),
    ).toBeNull();
  });

  it("falls back to the ids when the API does not send display names", () => {
    render(
      <CustodyCard
        arrangement={{ ...ARRANGEMENT, petName: null, caretakerName: null }}
        viewerId="user-1"
        today="2026-06-15"
      />,
    );

    expect(screen.getByText("pet-1")).toBeInTheDocument();
    expect(screen.getByTestId("custody-card-counterpart-custody-1")).toHaveTextContent(
      "user-2",
    );
  });
});

describe("getCustodyPerspective", () => {
  it("recognises the owner, the caretaker and a bystander", () => {
    expect(getCustodyPerspective(ARRANGEMENT, "user-1")).toBe("owner");
    expect(getCustodyPerspective(ARRANGEMENT, "user-2")).toBe("caretaker");
    expect(getCustodyPerspective(ARRANGEMENT, "user-9")).toBe("observer");
    expect(getCustodyPerspective(ARRANGEMENT, null)).toBe("observer");
  });
});
