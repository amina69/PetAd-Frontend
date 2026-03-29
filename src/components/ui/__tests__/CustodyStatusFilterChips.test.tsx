import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustodyListPage from "../../../pages/CustodyListPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { custodyService } from "../../../api/custodyService";

// Mock the custodyService
vi.mock("../../../api/custodyService", () => ({
  custodyService: {
    getList: vi.fn(),
  },
}));

const mockCustodyService = custodyService as {
  getList: vi.MockedFunction<typeof custodyService.getList>;
};

// Mock data
const mockCustodyList = [
  {
    id: "1",
    status: "ACTIVE",
    petId: "pet-1",
    custodianId: "user-1",
    ownerId: "user-2",
    startDate: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    status: "EXPIRING_SOON",
    petId: "pet-2",
    custodianId: "user-3",
    ownerId: "user-4",
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-02-15T00:00:00Z",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
];

describe("Custody Status Filter Chips", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders all custody status options", () => {
    mockCustodyService.getList.mockResolvedValue([]);

    render(<CustodyListPage />, { wrapper });

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Deposit Pending")).toBeInTheDocument();
    expect(screen.getByText("Deposit Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    expect(screen.getByText("Completing")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Disputed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("all chips start unselected", () => {
    mockCustodyService.getList.mockResolvedValue([]);

    render(<CustodyListPage />, { wrapper });

    expect(screen.getByText("Active")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Expiring Soon")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Completed")).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a chip and triggers API call with status filter", async () => {
    mockCustodyService.getList
      .mockResolvedValueOnce([]) // Initial call without filters
      .mockResolvedValueOnce([mockCustodyList[0]]); // Call with ACTIVE filter

    render(<CustodyListPage />, { wrapper });

    // Click the "Active" chip
    fireEvent.click(screen.getByText("Active"));

    // Wait for the API call with the filter
    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenCalledTimes(2);
    });

    // Verify the second call includes the status filter
    expect(mockCustodyService.getList).toHaveBeenLastCalledWith({
      status: ["ACTIVE"],
    });
  });

  it("selects EXPIRING_SOON chip and shows amber highlight", () => {
    mockCustodyService.getList.mockResolvedValue([]);

    render(<CustodyListPage />, { wrapper });

    const expiringSoonChip = screen.getByText("Expiring Soon");
    
    // Initially unselected with amber border
    expect(expiringSoonChip).toHaveAttribute("aria-pressed", "false");
    expect(expiringSoonChip).toHaveClass("border-amber-500", "text-amber-600");

    // Click to select
    fireEvent.click(expiringSoonChip);

    // Should now be selected with amber background
    expect(expiringSoonChip).toHaveAttribute("aria-pressed", "true");
    expect(expiringSoonChip).toHaveClass("bg-amber-500", "text-white", "border-amber-600");
  });

  it("deselects a chip on second click", async () => {
    mockCustodyService.getList
      .mockResolvedValueOnce([]) // Initial call
      .mockResolvedValueOnce([mockCustodyList[0]]) // With ACTIVE filter
      .mockResolvedValueOnce([]); // Without filter after deselect

    render(<CustodyListPage />, { wrapper });

    const activeChip = screen.getByText("Active");

    // Select the chip
    fireEvent.click(activeChip);

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenCalledWith({
        status: ["ACTIVE"],
      });
    });

    // Deselect the chip
    fireEvent.click(activeChip);

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenLastCalledWith(undefined);
    });

    expect(activeChip).toHaveAttribute("aria-pressed", "false");
  });

  it("can select multiple chips simultaneously", async () => {
    mockCustodyService.getList
      .mockResolvedValueOnce([]) // Initial call
      .mockResolvedValueOnce([mockCustodyList[0]]) // With ACTIVE
      .mockResolvedValueOnce(mockCustodyList); // With ACTIVE + EXPIRING_SOON

    render(<CustodyListPage />, { wrapper });

    // Select Active
    fireEvent.click(screen.getByText("Active"));

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenCalledWith({
        status: ["ACTIVE"],
      });
    });

    // Select Expiring Soon
    fireEvent.click(screen.getByText("Expiring Soon"));

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenLastCalledWith({
        status: ["ACTIVE", "EXPIRING_SOON"],
      });
    });

    expect(screen.getByText("Active")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Expiring Soon")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows 'Clear all' button when chips are selected", () => {
    mockCustodyService.getList.mockResolvedValue([]);

    render(<CustodyListPage />, { wrapper });

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();

    // Select a chip
    fireEvent.click(screen.getByText("Active"));

    // Should show Clear all button
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("clears all selections when 'Clear all' is clicked", async () => {
    mockCustodyService.getList
      .mockResolvedValueOnce([]) // Initial call
      .mockResolvedValueOnce([mockCustodyList[0]]) // With filter
      .mockResolvedValueOnce([]); // After clear

    render(<CustodyListPage />, { wrapper });

    // Select a chip first
    fireEvent.click(screen.getByText("Active"));

    await waitFor(() => {
      expect(screen.getByText("Clear all")).toBeInTheDocument();
    });

    // Click Clear all
    fireEvent.click(screen.getByText("Clear all"));

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenLastCalledWith(undefined);
    });

    expect(screen.getByText("Active")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });
});
