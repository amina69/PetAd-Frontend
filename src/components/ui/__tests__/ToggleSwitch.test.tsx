import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleSwitch } from "../ToggleSwitch";

describe("ToggleSwitch", () => {
  it("exposes a named switch and responds to keyboard activation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleSwitch
        checked={false}
        label="Email notifications"
        onChange={onChange}
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Email notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);

    toggle.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onChange = vi.fn();
    render(
      <ToggleSwitch
        checked
        disabled
        label="Email notifications"
        onChange={onChange}
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Email notifications" });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
