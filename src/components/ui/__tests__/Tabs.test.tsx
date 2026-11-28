import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../Tabs";

const items = [
  { value: "all", label: "All", content: "All requests" },
  { value: "pending", label: "Pending", content: "Pending requests" },
  { value: "archived", label: "Archived", content: "Archived requests", disabled: true },
  { value: "rejected", label: "Rejected", content: "Rejected requests" },
];

describe("Tabs", () => {
  it("renders a labelled tablist with roving tabindex and a single visible panel", () => {
    render(<Tabs items={items} ariaLabel="Approval status" />);

    const tablist = screen.getByRole("tablist", { name: "Approval status" });
    const tabs = screen.getAllByRole("tab");

    expect(tablist).toBeInTheDocument();
    expect(tabs).toHaveLength(4);

    const selected = screen.getByRole("tab", { name: "All" });
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveAttribute("tabindex", "0");
    expect(selected).toHaveAttribute("aria-controls");
    expect(screen.getByRole("tab", { name: "Pending" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tab", { name: "Archived" })).toBeDisabled();

    expect(screen.getByRole("tabpanel")).toHaveTextContent("All requests");
    expect(screen.queryByText("Pending requests")).not.toBeVisible();
  });

  it("moves and activates with arrow keys, skipping disabled tabs and wrapping", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Tabs items={items} ariaLabel="Approval status" onValueChange={onValueChange} />,
    );

    const all = screen.getByRole("tab", { name: "All" });
    all.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Pending" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Pending" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onValueChange).toHaveBeenLastCalledWith("pending");

    // "Rejected" is the next enabled tab after "Pending" ("Archived" is disabled).
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Rejected" })).toHaveFocus();

    // Wraps past the end back to the first tab.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();
  });

  it("supports Home and End", () => {
    render(<Tabs items={items} ariaLabel="Approval status" defaultValue="pending" />);

    const tablist = screen.getByRole("tablist");
    const pending = screen.getByRole("tab", { name: "Pending" });
    pending.focus();

    fireEvent.keyDown(tablist, { key: "End" });
    expect(screen.getByRole("tab", { name: "Rejected" })).toHaveFocus();

    fireEvent.keyDown(tablist, { key: "Home" });
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();
  });

  it("activates the tab that is clicked", async () => {
    const user = userEvent.setup();

    render(<Tabs items={items} ariaLabel="Approval status" />);

    await user.click(screen.getByRole("tab", { name: "Pending" }));

    expect(screen.getByRole("tab", { name: "Pending" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Pending requests");
  });

  it("respects controlled selection", () => {
    const { rerender } = render(
      <Tabs items={items} ariaLabel="Approval status" value="pending" />,
    );

    expect(screen.getByRole("tab", { name: "Pending" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    rerender(<Tabs items={items} ariaLabel="Approval status" value="rejected" />);

    expect(screen.getByRole("tab", { name: "Rejected" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
