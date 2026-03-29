import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCustodyList } from "../useCustodyList";
import { custodyService } from "../../api/custodyService";

// Mock the custodyService
vi.mock("../../api/custodyService", () => ({
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

describe("useCustodyList", () => {
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

  it("should fetch custody list without filters", async () => {
    mockCustodyService.getList.mockResolvedValue(mockCustodyList);

    const { result } = renderHook(() => useCustodyList(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockCustodyService.getList).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(mockCustodyList);
    expect(result.current.isError).toBe(false);
  });

  it("should fetch custody list with status filter", async () => {
    mockCustodyService.getList.mockResolvedValue([mockCustodyList[1]]);

    const { result } = renderHook(() => useCustodyList({ status: ["EXPIRING_SOON"] }), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockCustodyService.getList).toHaveBeenCalledWith({
      status: ["EXPIRING_SOON"],
    });
    expect(result.current.data).toEqual([mockCustodyList[1]]);
  });

  it("should fetch custody list with multiple status filters", async () => {
    mockCustodyService.getList.mockResolvedValue(mockCustodyList);

    const { result } = renderHook(
      () => useCustodyList({ status: ["ACTIVE", "EXPIRING_SOON"] }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockCustodyService.getList).toHaveBeenCalledWith({
      status: ["ACTIVE", "EXPIRING_SOON"],
    });
    expect(result.current.data).toEqual(mockCustodyList);
  });

  it("should handle API errors", async () => {
    const mockError = new Error("API Error");
    mockError.status = 500;
    mockCustodyService.getList.mockRejectedValue(mockError);

    const { result } = renderHook(() => useCustodyList(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it("should have correct query key", async () => {
    mockCustodyService.getList.mockResolvedValue(mockCustodyList);

    renderHook(() => useCustodyList({ status: ["ACTIVE"] }), { wrapper });

    await waitFor(() => {
      expect(mockCustodyService.getList).toHaveBeenCalled();
    });

    // Verify the query was cached with the correct key
    const cachedData = queryClient.getQueryData(["custody-list", ["ACTIVE"]]);
    expect(cachedData).toEqual(mockCustodyList);
  });
});
