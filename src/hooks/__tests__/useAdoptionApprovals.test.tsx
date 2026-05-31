import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { result, unmount } = renderHook(() => useAdoptionApprovals('123'));

    // Should have started polling
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    // Fast-forward to trigger interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Meet the quorum
    act(() => {
      result.current.setQuorumMet(true);
    });

    // Should clear the interval
    expect(clearIntervalSpy).toHaveBeenCalled();

    // Verify no extra polling after quorum met
    const currentCalls = setIntervalSpy.mock.calls.length;
    
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(setIntervalSpy).toHaveBeenCalledTimes(currentCalls); // no new intervals started

    // Verify cleanup on unmount
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2); // One for quorumMet, one for unmount
  });
});



  // Issues Implemented
  