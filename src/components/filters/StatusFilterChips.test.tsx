import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusFilterChips } from './StatusFilterChips';

const mockCounts = {
  PENDING: 5,
  APPROVED: 2,
  REJECTED: 1,
  DISPUTED: 3,
};

describe('StatusFilterChips', () => {
  it('renders all status chips', () => {
    render(<StatusFilterChips selectedStatuses={[]} counts={mockCounts} onChange={vi.fn()} />);
    
    expect(screen.getByRole('checkbox', { name: /Pending/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Approved/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Rejected/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Disputed/i })).toBeInTheDocument();
  });

  it('displays correct counts', () => {
    render(<StatusFilterChips selectedStatuses={[]} counts={mockCounts} onChange={vi.fn()} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // PENDING
    expect(screen.getByText('2')).toBeInTheDocument(); // APPROVED
    expect(screen.getByText('1')).toBeInTheDocument(); // REJECTED
    expect(screen.getByText('3')).toBeInTheDocument(); // DISPUTED
  });

  it('highlights selected chips and adds appropriate aria-checked state', () => {
    render(<StatusFilterChips selectedStatuses={['APPROVED', 'DISPUTED']} counts={mockCounts} onChange={vi.fn()} />);
    
    const approvedChip = screen.getByRole('checkbox', { name: /Approved/i });
    const pendingChip = screen.getByRole('checkbox', { name: /Pending/i });
    
    expect(approvedChip).toHaveAttribute('aria-checked', 'true');
    expect(pendingChip).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with added status when unselected chip is clicked', () => {
    const mockOnChange = vi.fn();
    render(<StatusFilterChips selectedStatuses={['PENDING']} counts={mockCounts} onChange={mockOnChange} />);
    
    const disputedChip = screen.getByRole('checkbox', { name: /Disputed/i });
    fireEvent.click(disputedChip);
    
    expect(mockOnChange).toHaveBeenCalledWith(['PENDING', 'DISPUTED']);
  });

  it('calls onChange with removed status when selected chip is clicked', () => {
    const mockOnChange = vi.fn();
    render(<StatusFilterChips selectedStatuses={['PENDING', 'DISPUTED']} counts={mockCounts} onChange={mockOnChange} />);
    
    const disputedChip = screen.getByRole('checkbox', { name: /Disputed/i });
    fireEvent.click(disputedChip);
    
    expect(mockOnChange).toHaveBeenCalledWith(['PENDING']);
  });
});
