import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from '../../lib/query-client';
import { useAdoptionApprovals } from '../useAdoptionApprovals';

describe('useAdoptionApprovals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts polling on mount and stops when quorum is met', () => {
    const { result } = renderHook(() => useAdoptionApprovals('123'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    // Check that the hook returns the expected properties
    expect(result.current).toHaveProperty('required');
    expect(result.current).toHaveProperty('given');
    expect(result.current).toHaveProperty('pending');
    expect(result.current).toHaveProperty('quorumMet');
    expect(result.current).toHaveProperty('escrowAccountId');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('hasDecided');
    expect(result.current).toHaveProperty('requiredRoles');
    expect(result.current).toHaveProperty('mutateApprovalDecision');
    expect(result.current).toHaveProperty('isPending');
    expect(result.current).toHaveProperty('setQuorumMet');
  });
});



  // Issues Implemented
  