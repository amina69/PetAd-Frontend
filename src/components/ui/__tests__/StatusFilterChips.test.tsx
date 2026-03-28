import { render, screen, fireEvent } from "@testing-library/react";
import { StatusFilterChips } from "../StatusFilterChips";
import { beforeEach, describe, expect, it, vi } from "vitest";
// import { useUrlSync } from "../../../hooks/useUrlSync";


// Controlled state that each test can seed
let mockStatus: string[] = [];
const mockSetUrlState = vi.fn((next: { status: string[] }) => {
  mockStatus = next.status;
});

vi.mock("../../../hooks/useUrlSync", () => ({
  useUrlSync: () => [{ status: mockStatus }, mockSetUrlState],
}));


const OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "pending", label: "Pending" },
];

describe("StatusFilterChips", () => {
  beforeEach(() => {
    // Reset mock state before every test so tests don't bleed into each other
    mockStatus = [];
    mockSetUrlState.mockClear();
  });

  it("renders all options", () => {
    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("all chips start unselected when no status in URL", () => {
    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.getByText("Open")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Closed")).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a chip on click", () => {
    render(<StatusFilterChips options={OPTIONS} />);

    fireEvent.click(screen.getByText("Open"));

    expect(mockSetUrlState).toHaveBeenCalledWith({ status: ["open"] });
  });

  it("deselects a chip on second click", () => {
    // Seed the mock so the chip renders as already selected
    mockStatus = ["open"];

    render(<StatusFilterChips options={OPTIONS} />);

    const chip = screen.getByText("Open");
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);

    expect(mockSetUrlState).toHaveBeenCalledWith({ status: [] });
  });

  it("shows 'Clear all' button when at least one chip is selected", () => {
    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Open"));

    // mockSetUrlState was called — re-render with updated state
    mockStatus = ["open"];
    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.getAllByText("Clear all")[0]).toBeInTheDocument();
  });

  it("clears all selections when 'Clear all' is clicked", () => {
    mockStatus = ["open"];

    render(<StatusFilterChips options={OPTIONS} />);

    fireEvent.click(screen.getByText("Clear all"));

    expect(mockSetUrlState).toHaveBeenCalledWith({ status: [] });
  });

  it("reads initial selection from URL state via the hook", () => {
    // Seed the hook mock to simulate ?status=closed being in the URL
    mockStatus = ["closed"];

    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.getByText("Closed")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Open")).toHaveAttribute("aria-pressed", "false");
  });

  it("can have multiple chips selected simultaneously", () => {
    mockStatus = ["open", "pending"];

    render(<StatusFilterChips options={OPTIONS} />);

    expect(screen.getByText("Open")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Pending")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Closed")).toHaveAttribute("aria-pressed", "false");
  });
});