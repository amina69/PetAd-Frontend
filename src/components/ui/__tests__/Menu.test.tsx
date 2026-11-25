import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Menu } from "../Menu";

const items = [
  { label: "Edit listing", onSelect: vi.fn() },
  { label: "Duplicate" },
  { label: "Delete", disabled: true },
  { label: "Archive" },
];

function renderMenu(onSelect = vi.fn()) {
  const user = userEvent.setup();
  render(
    <Menu
      ariaLabel="Listing actions"
      trigger={<button type="button">Actions</button>}
      items={[...items.slice(1), { label: "Edit listing", onSelect }]}
    />,
  );

  return { user, trigger: screen.getByRole("button", { name: "Actions" }), onSelect };
}

describe("Menu", () => {
  it("opens from the trigger, focuses the first enabled item and exposes menu semantics", async () => {
    const { user, trigger } = renderMenu();

    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const menu = screen.getByRole("menu", { name: "Listing actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
  });

  it("supports arrow keys, Home/End, typeahead and Escape", async () => {
    const { user, trigger } = renderMenu();
    await user.click(trigger);

    const menu = screen.getByRole("menu");
    const duplicate = screen.getByRole("menuitem", { name: "Duplicate" });
    const archive = screen.getByRole("menuitem", { name: "Archive" });

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(archive).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Edit listing" })).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(archive).toHaveFocus();

    fireEvent.keyDown(menu, { key: "Home" });
    expect(duplicate).toHaveFocus();

    fireEvent.keyDown(menu, { key: "End" });
    expect(archive).toHaveFocus();

    // Typeahead matches item labels and skips disabled entries.
    fireEvent.keyDown(menu, { key: "d" });
    expect(duplicate).toHaveFocus();

    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("runs the item action, closes and returns focus to the trigger", async () => {
    const onSelect = vi.fn();
    const { user, trigger } = renderMenu(onSelect);

    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Edit listing" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens with ArrowDown on the trigger", async () => {
    const { trigger } = renderMenu();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
  });
});
