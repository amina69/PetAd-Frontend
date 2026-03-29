import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';
import { ToastContainer } from '../Toast';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast({ type: 'success', title: 'Success', message: 'Success message' })}>Show Success</button>
      <button onClick={() => showToast({ type: 'error', title: 'Error', message: 'Error message' })}>Show Error</button>
      <button onClick={() => showToast({ type: 'info', title: 'Info', message: 'Info message' })}>Show Info</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <ToastProvider>
      <TestComponent />
      <ToastContainer />
    </ToastProvider>
  );
};

describe('GlobalToastSystem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a success toast with correct role and auto-dismisses after 5s', async () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByText('Show Success'));
    
    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    // Fast forward 5s
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('renders an error toast with role="alert" and auto-dismisses after 8s', async () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByText('Show Error'));
    
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
    
    // Fast forward 5s (should still be there)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Fast forward to 8s
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('manually dismisses a toast when clicking the close button', async () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Info')).not.toBeInTheDocument();
  });

  it('queues toasts when more than 3 are shown', async () => {
    renderWithProvider();
    
    // Show 5 toasts
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Info'));
    
    // Only 3 should be visible initially
    const statusToasts = screen.queryAllByRole('status');
    const alertToasts = screen.queryAllByRole('alert');
    const allToasts = [...statusToasts, ...alertToasts];
    expect(allToasts).toHaveLength(3);
    
    // Dismiss one
    const closeButtons = screen.getAllByLabelText('Close');
    fireEvent.click(closeButtons[0]);
    
    // A new one should appear from the queue
    const statusToastsAfter = screen.queryAllByRole('status');
    const alertToastsAfter = screen.queryAllByRole('alert');
    const allToastsAfter = [...statusToastsAfter, ...alertToastsAfter];
    expect(allToastsAfter).toHaveLength(3);
    
    // Specifically check if the 4th one (Error) is now visible
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
