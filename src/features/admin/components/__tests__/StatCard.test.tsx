import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StatCard } from "../StatCard";

const props = { title: "Pending approvals", to: "/admin/approvals?status=pending", icon: <span>Icon</span>, onRetry: vi.fn() };

describe("StatCard", () => {
  it("renders a loading state and a filtered list link when data is available", () => {
    const { rerender } = render(<MemoryRouter><StatCard {...props} isLoading isError={false} /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    rerender(<MemoryRouter><StatCard {...props} isLoading={false} isError={false} value={7} /></MemoryRouter>);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view list: pending approvals/i })).toHaveAttribute("href", props.to);
  });

  it("keeps an individual retry action on its error state", () => {
    props.onRetry.mockClear();
    render(<MemoryRouter><StatCard {...props} isLoading={false} isError /></MemoryRouter>);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load this count");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(props.onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
