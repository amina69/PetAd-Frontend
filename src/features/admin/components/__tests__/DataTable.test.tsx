import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "../DataTable";

interface Row { id: string; name: string }
const rows: Row[] = [{ id: "a", name: "Ada" }, { id: "b", name: "Bo" }];
const columns = [{ id: "name", header: "Name", sortable: true, accessor: (row: Row) => row.name }];

function CurrentSearch() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

describe("DataTable", () => {
  it("writes keyboard-operable sort and page controls to the URL", () => {
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();
    render(<MemoryRouter initialEntries={["/admin/users?page=2"]}>
      <DataTable columns={columns} rows={rows} getRowId={(row) => row.id} pageCount={4} onSortChange={onSortChange} onPageChange={onPageChange} />
      <CurrentSearch />
    </MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(screen.getByTestId("search").textContent).toContain("sort=name");
    expect(screen.getByTestId("search").textContent).toContain("direction=asc");
    expect(screen.getByTestId("search").textContent).toContain("page=1");
    expect(onSortChange).toHaveBeenCalledWith({ field: "name", direction: "asc" });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("search").textContent).toContain("page=2");
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it("announces and toggles selected rows", () => {
    render(<MemoryRouter><DataTable columns={columns} rows={rows} getRowId={(row) => row.id} pageCount={1} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select row a" }));
    expect(screen.getByText("1 row selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(screen.getByText("2 rows selected")).toBeInTheDocument();
  });
});
