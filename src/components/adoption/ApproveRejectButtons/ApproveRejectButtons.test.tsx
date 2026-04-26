import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import '@testing-library/jest-dom';
import { ApproveRejectButtons } from './ApproveRejectButtons';
import { useRoleGuard } from '../../../hooks/useRoleGuard';
import { useAdoptionApprovals } from '../../../hooks/useAdoptionApprovals';
import toast from 'react-hot-toast';

// Mock the hooks and toast
vi.mock('../../../hooks/useRoleGuard');
vi.mock('../../../hooks/useAdoptionApprovals');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

const mockUseRoleGuard = useRoleGuard as MockedFunction<typeof useRoleGuard>;
const mockUseAdoptionApprovals = useAdoptionApprovals as MockedFunction<typeof useAdoptionApprovals>;

describe('ApproveRejectButtons', () => {
  const defaultAdoptionId = 'adoption-123';
  const mockMutateApprovalDecision = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseRoleGuard.mockReturnValue({
      role: 'admin',
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });

    mockUseAdoptionApprovals.mockReturnValue({
      hasDecided: false,
      requiredRoles: ['admin'],
      mutateApprovalDecision: mockMutateApprovalDecision,
      isPending: false,
    });

    // Make mutateApprovalDecision return a resolved promise by default
    mockMutateApprovalDecision.mockResolvedValue(undefined);
  });

  describe('Visibility', () => {
    it('does NOT render when user already decided', () => {
      mockUseAdoptionApprovals.mockReturnValue({
        hasDecided: true,
        requiredRoles: ['admin'],
        mutateApprovalDecision: mockMutateApprovalDecision,
        isPending: false,
      });

      const { container } = render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);
      expect(container.firstChild).toBeNull();
    });

    it('does NOT render when user role not in requiredRoles', () => {
      mockUseRoleGuard.mockReturnValue({
        role: 'user',
        isAdmin: false,
        isUser: true,
        hasAccess: vi.fn().mockReturnValue(false),
      });

      const { container } = render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when eligible', () => {
      render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);
      expect(screen.getByRole('button', { name: /Approve adoption/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject adoption/i })).toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('Approve button triggers mutation and shows success toast', async () => {
      render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);
      
      const approveButton = screen.getByRole('button', { name: /Approve adoption/i });
      fireEvent.click(approveButton);

      expect(mockMutateApprovalDecision).toHaveBeenCalledWith({ decision: 'APPROVED' });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Your approval has been recorded');
      });
    });

    it('Reject button opens modal and Modal confirm triggers rejection mutation', async () => {
      render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);
      
      const rejectButton = screen.getByRole('button', { name: /Reject adoption/i });
      fireEvent.click(rejectButton);

      // Modal should be open now, verify modal title
      expect(screen.getByText('Rejection Reason')).toBeInTheDocument();

      // Enter a reason that is at least 20 characters
      const reasonInput = screen.getByLabelText(/Detailed reason/i);
      fireEvent.change(reasonInput, { target: { value: 'This is a valid long reason for rejection' } });

      // Click submit
      const submitButton = screen.getByRole('button', { name: /Submit Rejection/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateApprovalDecision).toHaveBeenCalledWith({
          decision: 'REJECTED',
          reason: 'This is a valid long reason for rejection',
        });
        expect(toast.success).toHaveBeenCalledWith('Your approval has been recorded');
      });
    });
  });

  describe('State', () => {
    it('Buttons disabled during loading and Spinner visible when isPending === true', () => {
      mockUseAdoptionApprovals.mockReturnValue({
        hasDecided: false,
        requiredRoles: ['admin'],
        mutateApprovalDecision: mockMutateApprovalDecision,
        isPending: true,
      });

      render(<ApproveRejectButtons adoptionId={defaultAdoptionId} />);

      const approveButton = screen.getByRole('button', { name: /Approve adoption/i });
      const rejectButton = screen.getByRole('button', { name: /Reject adoption/i });

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();

      // Should find two spinners (one in each button)
      const spinners = screen.getAllByLabelText('Loading spinner');
      expect(spinners).toHaveLength(2);
    });
  });
});
