import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAdoptionList } from './useAdoptionList';

describe('useAdoptionList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initially returns isLoading as true and empty data', () => {
    const { result } = renderHook(() => useAdoptionList({ status: [] }));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    // Counts should be populated immediately
    expect(result.current.counts).toEqual({
      PENDING: 2,
      APPROVED: 2,
      REJECTED: 1,
      DISPUTED: 3,
    });
  });

  it('returns all mock data when no status filter is provided', async () => {
    const { result } = renderHook(() => useAdoptionList({ status: [] }));

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(8); // All 8 mock items
  });

  it('filters data by a single status', async () => {
    const { result } = renderHook(() => useAdoptionList({ status: ['DISPUTED'] }));

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(3);
    result.current.data.forEach(item => {
      expect(item.status).toBe('DISPUTED');
    });
  });

  it('filters data by multiple statuses', async () => {
    const { result } = renderHook(() => useAdoptionList({ status: ['PENDING', 'REJECTED'] }));

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(3); // 2 PENDING + 1 REJECTED
    result.current.data.forEach(item => {
      expect(['PENDING', 'REJECTED']).toContain(item.status);
    });
  });

  it('refetches data when status changes', async () => {
    const { result, rerender } = renderHook(
      (props) => useAdoptionList(props),
      { initialProps: { status: [] as any } }
    );

    act(() => {
      vi.runAllTimers();
    });
    
    expect(result.current.data).toHaveLength(8);

    // Change status
    rerender({ status: ['APPROVED'] });

    expect(result.current.isLoading).toBe(true); // Should go back to loading

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(2); // 2 APPROVED
  });
});
