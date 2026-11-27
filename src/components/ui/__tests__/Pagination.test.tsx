import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getPageRange, Pagination } from "../Pagination";

describe("getPageRange", () => {
  it.each([
    { total: 1, page: 1, expected: [1] },
    { total: 2, page: 1, expected: [1, 2] },
    { total: 7, page: 4, expected: [1, 2, 3, 4, 5, 6, 7] },
    {
      total: 100,
      page: 1,
      expected: [1, 2, 3, 4, 5, "ellipsis-end", 100],
    },
    {
      total: 100,
      page: 50,
      expected: [1, "ellipsis-start", 49, 50, 51, "ellipsis-end", 100],
    },
    {
      total: 100,
      page: 100,
      expected: [1, "ellipsis-start", 96, 97, 98, 99, 100],
    },
  ])("returns the right window for $total pages at page $page", ({ total, page, expected }) => {
    expect(getPageRange(page, total)).toEqual(expected);
  });

  it("clamps out-of-range input", () => {
    expect(getPageRange(0, 0)).toEqual([1]);
    expect(getPageRange(999, 10)).toEqual(getPageRange(10, 10));
  });
});

describe("Pagination", () => {
  it("marks the current page and hides itself for a single page", () => {
    const { rerender } = render(
      <Pagination page={3} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page-3")).toHaveAttribute(
      "aria-current",
      "page",
    );

    rerender(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("calls onPageChange for page numbers and previous/next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);

    await user.click(screen.getByTestId("pagination-page-3"));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    await user.click(screen.getByTestId("pagination-prev"));
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    await user.click(screen.getByTestId("pagination-next"));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={4} onPageChange={vi.fn()} />,
    );

    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
    expect(screen.getByTestId("pagination-next")).toBeEnabled();

    rerender(<Pagination page={4} totalPages={4} onPageChange={vi.fn()} />);

    expect(screen.getByTestId("pagination-next")).toBeDisabled();
  });

  it("accepts a custom test id and aria label", () => {
    render(
      <Pagination
        page={1}
        totalPages={2}
        onPageChange={vi.fn()}
        ariaLabel="Approval list pagination"
        data-testid="approval-pagination"
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Approval list pagination" }),
    ).toHaveAttribute("data-testid", "approval-pagination");
  });
});
