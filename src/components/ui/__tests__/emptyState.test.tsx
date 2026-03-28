import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { EmptyState } from "../emptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No settlements yet"
        description="Settlement data will appear once the escrow is triggered."
      />,
    );

    expect(screen.getByText("No settlements yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Settlement data will appear once the escrow is triggered.",
      ),
    ).toBeTruthy();
  });

  it("renders the action button when action prop is provided", () => {
    const onClick = vi.fn();

    render(
      <EmptyState
        title="Nothing here"
        description="Try again later."
        action={{ label: "Retry", onClick }}
      />,
    );

    const button = screen.getByRole("button", { name: "Retry" });
    expect(button).toBeTruthy();
  });

  it("calls onClick when the action button is clicked", () => {
    const onClick = vi.fn();

    render(
      <EmptyState
        title="Nothing here"
        description="Try again later."
        action={{ label: "Retry", onClick }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render a button when action prop is omitted", () => {
    render(
      <EmptyState
        title="Nothing here"
        description="No action needed."
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has role='status' and aria-label set to the title", () => {
    render(
      <EmptyState
        title="Empty queue"
        description="Queue is currently empty."
      />,
    );

    const region = screen.getByRole("status");
    expect(region).toBeTruthy();
    expect(region.getAttribute("aria-label")).toBe("Empty queue");
  });
});