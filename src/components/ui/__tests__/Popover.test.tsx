import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "../Popover";

function Fixture({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Popover
      trigger={<button type="button">Open filters</button>}
      ariaLabel="Filters"
      onOpenChange={onOpenChange}
    >
      <button type="button">Apply</button>
    </Popover>
  );
}

describe("Popover", () => {
  it("toggles from the trigger and wires dialog semantics + aria-expanded", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open filters" });

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const panel = screen.getByRole("dialog", { name: "Filters" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(trigger);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Open filters" }));

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps the panel closed when open is controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Popover
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button type="button">Filters</button>}
        ariaLabel="Filters"
      >
        Body
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();

    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
