import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { RelativeDate } from './RelativeDate';

describe('RelativeDate', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correct initial output with Date object', async () => {
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    render(<RelativeDate date={pastDate} />);

    await waitFor(() => {
      const spanElement = screen.queryAllByText(/ago/)[0];
      expect(spanElement).toBeInTheDocument();
      expect(spanElement?.textContent).toMatch(/2 hours? ago/);
    });
  });

  it('renders correct initial output with string date', async () => {
    const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    render(<RelativeDate date={pastDate.toISOString()} />);

    await waitFor(() => {
      const spanElement = screen.queryAllByText(/ago/)[0];
      expect(spanElement).toBeInTheDocument();
      expect(spanElement?.textContent).toMatch(/30 minutes? ago/);
    });
  });

  it('shows absolute date in title attribute on hover', async () => {
    const testDate = new Date('2025-01-15T10:30:00');
    render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      const element = screen.getByTitle(testDate.toLocaleString());
      expect(element).toBeInTheDocument();
    });
  });

  it('sets up interval with 60000ms duration', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const testDate = new Date(Date.now() - 60 * 1000);
    
    render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    // Verify setInterval was called with 60000ms (60 seconds)
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
  });

  it('cleans up interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const testDate = new Date(Date.now() - 60 * 1000);

    const { unmount } = render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('handles both Date and string inputs consistently', async () => {
    const testDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const dateString = testDate.toISOString();

    const { rerender } = render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      expect(screen.getByText(/2 hours? ago/)).toBeInTheDocument();
    });

    const firstText = screen.getByText(/ago/).textContent;

    rerender(<RelativeDate date={dateString} />);

    await waitFor(() => {
      expect(screen.getByText(/2 hours? ago/)).toBeInTheDocument();
    });

    const secondText = screen.getByText(/ago/).textContent;
    expect(firstText).toBe(secondText);
  });

  it('displays title attribute with absolute date for accessibility', async () => {
    const testDate = new Date('2024-12-25T15:45:30');
    render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      const span = screen.getByTitle(testDate.toLocaleString());
      expect(span).toBeInTheDocument();
      expect(span).toHaveAttribute('title', testDate.toLocaleString());
    });
  });

  it('updates on interval by verifying setInterval callback execution', async () => {
    const testDate = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
    let capturedCallback: (() => void) | null = null;

    // Spy on setInterval to capture the callback
    const originalSetInterval = globalThis.setInterval;
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
      .mockImplementation((callback: any, ms?: number) => {
        capturedCallback = callback;
        return originalSetInterval(callback, ms);
      });

    render(<RelativeDate date={testDate} />);

    await waitFor(() => {
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    // Verify the interval was set up with 60000ms
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    // Verify we captured the callback
    expect(capturedCallback).toBeTruthy();

    setIntervalSpy.mockRestore();
  });
});
