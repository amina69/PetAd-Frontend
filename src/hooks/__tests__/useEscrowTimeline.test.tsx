import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEscrowTimeline } from '../useEscrowTimeline';
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

describe('useEscrowTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter out non-escrow events', async () => {
    const mockTimeline = [
      { id: '1', sdkEvent: 'ESCROW_CREATED', message: 'Escrow created' },
      { id: '2', sdkEvent: 'PET_UPDATED', message: 'Pet updated' },
      { id: '3', sdkEvent: 'ESCROW_FUNDED', message: 'Escrow funded' },
      { id: '4', sdkEvent: 'OTHER_EVENT', message: 'Other' },
    ];

    vi.mocked(adoptionService.getTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderHook(() => useEscrowTimeline('adoption-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].sdkEvent).toBe('ESCROW_CREATED');
    expect(result.current.entries[1].sdkEvent).toBe('ESCROW_FUNDED');
  });

  it('should handle loading and error states', async () => {
    vi.mocked(adoptionService.getTimeline).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useEscrowTimeline('adoption-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.entries).toEqual([]);
  });
});
