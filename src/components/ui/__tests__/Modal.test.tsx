import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "../Modal";
import { Drawer } from "../Drawer";

describe("Modal", () => {
  it("portals into the body and exposes its title and modal state", () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete listing" data-testid="modal">
        Body copy
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Delete listing" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body).toContainElement(dialog);
    expect(screen.getByText("Body copy")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open settings
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Settings">
            Settings body
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open settings" });

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on backdrop click but not on clicks inside the panel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Filters" data-testid="filters">
        Panel content
      </Modal>,
    );

    await user.click(screen.getByText("Panel content"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("filters-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scrolling while open and restores it afterwards", () => {
    const before = document.body.style.overflow;
    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="Details">
        Body
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal open={false} onClose={vi.fn()} title="Details">
        Body
      </Modal>,
    );

    expect(document.body.style.overflow).toBe(before);
  });

  it("closes only the topmost of nested modals on Escape", () => {
    function Nested() {
      const [outerOpen, setOuterOpen] = useState(true);
      const [innerOpen, setInnerOpen] = useState(true);

      return (
        <>
          <Modal
            open={outerOpen}
            onClose={() => setOuterOpen(false)}
            title="Outer"
            data-testid="outer-modal"
          >
            Outer body
          </Modal>
          <Modal
            open={innerOpen}
            onClose={() => setInnerOpen(false)}
            title="Inner"
            data-testid="inner-modal"
          >
            Inner body
          </Modal>
        </>
      );
    }

    render(<Nested />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("inner-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("outer-modal")).toBeInTheDocument();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();

    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Confirm"
        showCloseButton={false}
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Confirm</button>
          </>
        }
      />,
    );

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm" });

    confirm.focus();
    await user.tab();
    expect(cancel).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("renders a Drawer with modal semantics", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Filters" side="start" data-testid="drawer">
        Drawer body
      </Drawer>,
    );

    const dialog = screen.getByRole("dialog", { name: "Filters" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("start-0");
  });
});
