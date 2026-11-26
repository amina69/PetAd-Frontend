import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ApprovalPagination,
  getPageItems,
  APPROVAL_PAGE_SIZE,
} from "../ApprovalPagination";

describe("ApprovalPagination", () => {
  it("renders nothing when the list fits on a single page", () => {
    const { container } = render(
      <ApprovalPagination page={1} total={APPROVAL_PAGE_SIZE} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders prev/next and numbered pages for multiple pages", () => {
    render(<ApprovalPagination page={1} total={30} onPageChange={vi.fn()} />);

    const pagination = screen.getByRole("navigation", {
      name: "Approval list pagination",
    });

    expect(within(pagination).getByTestId("pagination-prev")).toBeDisabled();
    expect(within(pagination).getByTestId("pagination-next")).toBeEnabled();
    expect(within(pagination).getByTestId("pagination-page-1")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(pagination).getByTestId("pagination-page-2")).toBeInTheDocument();
    expect(within(pagination).getByTestId("pagination-page-3")).toBeInTheDocument();
  });

  it("calls onPageChange with the requested page", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<ApprovalPagination page={2} total={30} onPageChange={onPageChange} />);

    await user.click(screen.getByTestId("pagination-next"));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByTestId("pagination-prev"));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByTestId("pagination-page-3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("collapses long page ranges with ellipses around the current page", () => {
    const items = getPageItems(10, 20);

    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(20);
    expect(items).toContain(9);
    expect(items).toContain(10);
    expect(items).toContain(11);
    expect(items.filter((item) => typeof item === "string")).toHaveLength(2);
  });
});
