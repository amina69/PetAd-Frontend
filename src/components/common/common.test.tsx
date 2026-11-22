import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { StatusBadge } from "./StatusBadge";

describe("shared UI", () => {
  it("reads StatusBadge copy from statusConfig", () => {
    render(<StatusBadge domain="approval" status="APPROVED" />);
    const badge = screen.getByText("Approved");
    expect(badge).toHaveAttribute("data-tone", "success");
    expect(badge).toHaveAttribute("data-domain", "approval");
  });

  it("renders an EmptyState title, description, and action", () => {
    render(
      <EmptyState
        title="No pets yet"
        description="Listings will show up here."
        action={<button type="button">Add pet</button>}
      />,
    );
    expect(screen.getByText("No pets yet")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-message")).toHaveTextContent("Listings will show up here.");
    expect(screen.getByRole("button", { name: "Add pet" })).toBeInTheDocument();
  });

  it("renders a Skeleton placeholder", () => {
    render(<Skeleton width="40%" height={12} />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ width: "40%", height: "12px" });
  });

  it("uses the destructive confirm variant and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <>
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            Delete
          </button>
          <ConfirmDialog
            open={open}
            title="Delete listing?"
            destructive
            confirmLabel="Delete listing"
            triggerRef={triggerRef}
            onConfirm={onConfirm}
            onCancel={() => setOpen(false)}
          />
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirm = screen.getByRole("button", { name: "Delete listing" });
    expect(confirm).toHaveAttribute("data-variant", "destructive");
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });
});
