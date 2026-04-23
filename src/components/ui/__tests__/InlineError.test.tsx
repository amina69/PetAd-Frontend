import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InlineError } from "../InlineError";

describe("InlineError", () => {
  it("renders the error message", () => {
    render(<InlineError message="This field is required" />);
    expect(screen.getByText("This field is required")).toBeTruthy();
  });

  it("has role='alert' so screen readers announce it immediately", () => {
    render(<InlineError message="Something went wrong" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
  });

  it("renders the warning triangle icon", () => {
    const { container } = render(<InlineError message="Invalid input" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("icon has aria-hidden to avoid redundant screen reader output", () => {
    const { container } = render(<InlineError message="Invalid input" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sets id to '{field}-error' when field prop is provided", () => {
    render(<InlineError field="email" message="Email is required" />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("id")).toBe("email-error");
  });

  it("does not set id when field prop is omitted", () => {
    render(<InlineError message="Generic error" />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("id")).toBeNull();
  });

  it("renders different messages correctly", () => {
    const { rerender } = render(<InlineError message="First error" />);
    expect(screen.getByText("First error")).toBeTruthy();

    rerender(<InlineError message="Second error" />);
    expect(screen.getByText("Second error")).toBeTruthy();
  });
});