import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdoptionTimeline } from '../useAdoptionTimeline';
import { adoptionService } from '../../api/adoptionService';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('../../api/adoptionService', () => ({
  adoptionService: {
    getTimeline: vi.fn(),
  },
}));

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

describe('useAdoptionTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return all timeline entries', async () => {
    const mockTimeline = [
      {
        fromStatus: null,
        toStatus: 'ESCROW_CREATED',
        actor: 'System',
        timestamp: '2026-03-25T10:00:00Z',
        reason: 'Initial',
      },
      {
        fromStatus: 'ESCROW_CREATED',
        toStatus: 'ESCROW_FUNDED',
        actor: 'Adopter',
        timestamp: '2026-03-25T11:00:00Z',
        sdkTxHash: '0x123',
      },
    ];

    vi.mocked(adoptionService.getTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderHook(() => useAdoptionTimeline('adoption-1'), {
      wrapper: createWrapper(),
    });

    // Check loading state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].toStatus).toBe('ESCROW_CREATED');
    expect(result.current.entries[1].actor).toBe('Adopter');
    expect(result.current.isError).toBe(false);
  });

  it('should handle error states', async () => {
    vi.mocked(adoptionService.getTimeline).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useAdoptionTimeline('adoption-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.entries).toEqual([]);
  });
});
