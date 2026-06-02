import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ApprovalStatusList } from "../ApprovalStatusList";
import type { ApprovalDecision } from "../../../types/adoption";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const REQUIRED_ROLES = ["admin", "manager", "reviewer"];

function makeDecision(
  overrides: Partial<ApprovalDecision> & Pick<ApprovalDecision, "approverRole" | "status">,
): ApprovalDecision {
  return {
    id: `dec-${overrides.approverRole}`,
    approverName: `${overrides.approverRole} User`,
    timestamp: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("ApprovalStatusList", () => {
  // 1. Pending role shows clock icon and muted (opacity-60) style
  it("renders a pending role with clock icon and muted row style", () => {
    render(
      <ApprovalStatusList
        required={["admin"]}
        given={[]}
      />,
    );

    // Clock badge is present
    expect(screen.getByTestId("state-icon-pending")).toBeInTheDocument();
    expect(screen.getByTestId("state-icon-pending")).toHaveTextContent("Pending");

    // Row carries the muted opacity class
    const row = screen.getByTestId("approval-row-admin");
    expect(row).toHaveClass("opacity-60");
  });

  // 2. Required role with APPROVED decision renders green tick
  it("renders an approved role with green checkmark badge", () => {
    const given = [makeDecision({ approverRole: "admin", status: "APPROVED" })];

    render(
      <ApprovalStatusList
        required={["admin"]}
        given={given}
      />,
    );

    expect(screen.getByTestId("state-icon-approved")).toBeInTheDocument();
    expect(screen.getByTestId("state-icon-approved")).toHaveTextContent("Approved");

    // Full opacity — muted class must NOT be present
    const row = screen.getByTestId("approval-row-admin");
    expect(row).not.toHaveClass("opacity-60");
    expect(row).toHaveClass("opacity-100");
  });

  // 3. Required role with REJECTED decision renders red X
  it("renders a rejected role with red X badge", () => {
    const given = [makeDecision({ approverRole: "manager", status: "REJECTED" })];

    render(
      <ApprovalStatusList
        required={["manager"]}
        given={given}
      />,
    );

    expect(screen.getByTestId("state-icon-rejected")).toBeInTheDocument();
    expect(screen.getByTestId("state-icon-rejected")).toHaveTextContent("Rejected");

    const row = screen.getByTestId("approval-row-manager");
    expect(row).not.toHaveClass("opacity-60");
    expect(row).toHaveClass("opacity-100");
  });

  // 4. Each row's aria-label contains the correct role name
  it("sets aria-label='Approval status for [Role]' on every row", () => {
    const given = [makeDecision({ approverRole: "admin", status: "APPROVED" })];

    render(
      <ApprovalStatusList
        required={["admin", "manager"]}
        given={given}
      />,
    );

    expect(
      screen.getByRole("listitem", { name: "Approval status for Admin" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("listitem", { name: "Approval status for Manager" }),
    ).toBeInTheDocument();
  });

  // 5. All three states render correctly in the same list
  it("renders pending, approved, and rejected states together correctly", () => {
    const given = [
      makeDecision({ approverRole: "admin", status: "APPROVED" }),
      makeDecision({ approverRole: "manager", status: "REJECTED" }),
    ];

    render(
      <ApprovalStatusList
        required={REQUIRED_ROLES}
        given={given}
      />,
    );

    // Three rows rendered
    const list = screen.getByTestId("approval-status-list");
    expect(list.querySelectorAll("li")).toHaveLength(3);

    // Correct badges
    expect(screen.getByTestId("state-icon-approved")).toHaveTextContent("Approved");
    expect(screen.getByTestId("state-icon-rejected")).toHaveTextContent("Rejected");
    expect(screen.getByTestId("state-icon-pending")).toHaveTextContent("Pending");

    // Opacity classes
    expect(screen.getByTestId("approval-row-admin")).toHaveClass("opacity-100");
    expect(screen.getByTestId("approval-row-manager")).toHaveClass("opacity-100");
    expect(screen.getByTestId("approval-row-reviewer")).toHaveClass("opacity-60");

    // Role labels rendered
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });
});
