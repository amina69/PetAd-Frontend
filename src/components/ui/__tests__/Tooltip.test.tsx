import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("shows on keyboard focus, describes the trigger and hides on Escape", async () => {
    render(
      <Tooltip content="Deletes the listing">
        <button type="button">Delete</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Delete" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Deletes the listing");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });

  it("shows after the hover delay", async () => {
    render(
      <Tooltip content="Archived items" delayMs={0}>
        <button type="button">Archive</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Archive" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Archived items");
  });

  it("wraps a non-focusable trigger in a focusable element", async () => {
    const { container } = render(
      <Tooltip content="More information">
        <span>Info</span>
      </Tooltip>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute("tabindex", "0");

    fireEvent.focus(wrapper);

    const tooltip = await screen.findByRole("tooltip");
    expect(wrapper).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("does not render when disabled", async () => {
    render(
      <Tooltip content="Hidden" disabled>
        <button type="button">Disabled trigger</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "Disabled trigger" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
