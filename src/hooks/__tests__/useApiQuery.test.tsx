import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApiQuery } from "../useApiQuery";
import type { ApiError } from "../../types/auth";

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useApiQuery', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window.location mock
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, assign: vi.fn(), href: '' },
        });
    });

    it('should return data successfully', async () => {
        const mockData = { id: 1, name: 'Test Pet' };
        const fetchFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(() => useApiQuery(['test'], fetchFn), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual(mockData);
        expect(result.current.isError).toBe(false);
    });

    it('should handle 401 and redirect to login', async () => {
        const error: ApiError = new Error('Unauthorized');
        error.status = 401;
        const fetchFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useApiQuery(['auth-error'], fetchFn), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(window.location.assign).toHaveBeenCalledWith('/login');
    });

    it('should return isForbidden true for 403', async () => {
        const error: ApiError = new Error('Forbidden');
        error.status = 403;
        const fetchFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useApiQuery(['forbidden-error'], fetchFn), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isForbidden).toBe(true);
        expect(result.current.isError).toBe(true);
    });

    it('should return isNotFound true for 404', async () => {
        const error: ApiError = new Error('Not Found');
        error.status = 404;
        const fetchFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useApiQuery(['notfound-error'], fetchFn), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isNotFound).toBe(true);
        expect(result.current.isError).toBe(true);
    });
});
