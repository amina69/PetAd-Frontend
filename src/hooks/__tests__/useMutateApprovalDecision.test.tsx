import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useMutateApprovalDecision } from "../useMutateApprovalDecision";
import { vi } from "vitest";

vi.mock("axios");

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useMutateApprovalDecision", () => {
  it("calls API on mutate", async () => {
    const wrapper = createWrapper();

    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });

    const { result } = renderHook(
      () => useMutateApprovalDecision("123"),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        decision: "approved",
      });
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/adoption/123/approve",
      { decision: "approved", reason: undefined }
    );
  });

  it("invalidates queries on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });

    const { result } = renderHook(
      () => useMutateApprovalDecision("123"),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        decision: "approved",
      });
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});