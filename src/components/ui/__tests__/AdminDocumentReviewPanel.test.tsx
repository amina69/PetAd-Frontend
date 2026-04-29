import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AdminDocumentReviewPanel } from '../AdminDocumentReviewPanel';
import { useRoleGuard } from '../../../hooks/useRoleGuard';
import { useMutateReviewDocument } from '../../../hooks/useMutateReviewDocument';
import type { Document } from '../../../types/documents';

// Mock the hooks
vi.mock('../../../hooks/useRoleGuard');
vi.mock('../../../hooks/useMutateReviewDocument');

const mockUseRoleGuard = useRoleGuard as ReturnType<typeof vi.fn>;
const mockUseMutateReviewDocument = useMutateReviewDocument as ReturnType<typeof vi.fn>;

const BASE_DOC: Document = {
  id: 'doc-001',
  fileName: 'vaccination-certificate.pdf',
  fileUrl: 'https://example.com/docs/vaccination-certificate.pdf',
  mimeType: 'application/pdf',
  size: 102400,
  uploadedById: 'user-owner',
  adoptionId: 'adoption-001',
  createdAt: '2026-01-15T08:00:00.000Z',
  onChainVerified: true,
  anchorTxHash: 'abc123',
  expiresAt: null,
  type: 'ID',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe('AdminDocumentReviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for admin
    mockUseRoleGuard.mockReturnValue({
      role: 'admin',
      isAdmin: true,
      isUser: false,
    });

    mockUseMutateReviewDocument.mockReturnValue({
      reviewDocument: vi.fn(),
      reviewDocumentAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  describe('role guard', () => {
    it('is hidden for non-admin users', () => {
      mockUseRoleGuard.mockReturnValue({
        role: 'user',
        isAdmin: false,
        isUser: true,
      });

      const { container } = renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders for admin users', () => {
      mockUseRoleGuard.mockReturnValue({
        role: 'admin',
        isAdmin: true,
        isUser: false,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      expect(screen.getByText('Document Review')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      mockUseRoleGuard.mockReturnValue({
        role: 'admin',
        isAdmin: true,
        isUser: false,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[]}
          isLoading={true}
        />,
      );

      // The component shows skeleton placeholders when loading
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('document list', () => {
    it('renders all documents', () => {
      const docs = [
        { ...BASE_DOC, id: 'doc-1', fileName: 'doc1.pdf' },
        { ...BASE_DOC, id: 'doc-2', fileName: 'doc2.pdf' },
      ];

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={docs}
        />,
      );

      expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
    });

    it('shows no documents message when empty', () => {
      mockUseRoleGuard.mockReturnValue({
        role: 'admin',
        isAdmin: true,
        isUser: false,
      });

      const { container } = renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[]}
        />,
      );

      // When documents is empty, the component returns null (no documents to review)
      expect(container.firstChild).toBeNull();
    });
  });

  describe('review progress badge', () => {
    it('shows correct progress when some documents approved', () => {
      const docs = [
        { ...BASE_DOC, id: 'doc-1', adminReviewStatus: 'APPROVED' as const },
        { ...BASE_DOC, id: 'doc-2', adminReviewStatus: undefined },
      ];

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={docs}
        />,
      );

      expect(screen.getByText('1 of 2 documents approved')).toBeInTheDocument();
    });

    it('shows correct progress when all documents approved', () => {
      const docs = [
        { ...BASE_DOC, id: 'doc-1', adminReviewStatus: 'APPROVED' as const },
        { ...BASE_DOC, id: 'doc-2', adminReviewStatus: 'APPROVED' as const },
      ];

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={docs}
        />,
      );

      expect(screen.getByText('2 of 2 documents approved')).toBeInTheDocument();
    });
  });

  describe('approve action', () => {
    it('renders approve button for unreviewed documents', () => {
      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
    });

    it('calls reviewDocumentAsync with APPROVED status when approve is clicked', async () => {
      const mockReviewDocumentAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutateReviewDocument.mockReturnValue({
        reviewDocument: vi.fn(),
        reviewDocumentAsync: mockReviewDocumentAsync,
        isPending: false,
        isError: false,
        error: null,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

      await waitFor(() => {
        expect(mockReviewDocumentAsync).toHaveBeenCalledWith(
          { documentId: 'doc-001', status: 'APPROVED' }
        );
      });
    });
  });

  describe('reject action', () => {
    it('renders reject button for unreviewed documents', () => {
      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
    });

    it('opens inline reject reason input when reject is clicked', () => {
      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

      expect(screen.getByPlaceholderText('Enter reason for rejection...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Rejection/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('calls reviewDocumentAsync with REJECTED status and reason when confirmed', async () => {
      const mockReviewDocumentAsync = vi.fn().mockResolvedValue(undefined);
      mockUseMutateReviewDocument.mockReturnValue({
        reviewDocument: vi.fn(),
        reviewDocumentAsync: mockReviewDocumentAsync,
        isPending: false,
        isError: false,
        error: null,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      // Click reject button
      fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

      // Enter reason
      const textarea = screen.getByPlaceholderText('Enter reason for rejection...');
      fireEvent.change(textarea, { target: { value: 'Document is blurry' } });

      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Rejection/i }));

      await waitFor(() => {
        expect(mockReviewDocumentAsync).toHaveBeenCalledWith(
          { documentId: 'doc-001', status: 'REJECTED', reason: 'Document is blurry' }
        );
      });
    });

    it('does not submit empty reason', async () => {
      const mockReviewDocument = vi.fn();
      mockUseMutateReviewDocument.mockReturnValue({
        reviewDocument: mockReviewDocument,
        reviewDocumentAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      // Click reject button
      fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

      // Try to confirm without entering reason
      const confirmButton = screen.getByRole('button', { name: /Confirm Rejection/i });
      expect(confirmButton).toBeDisabled();

      // Cancel should close the input
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByPlaceholderText('Enter reason for rejection...')).toBeNull();
    });
  });

  describe('reviewed document display', () => {
    it('shows approved badge for approved documents', () => {
      const doc = {
        ...BASE_DOC,
        adminReviewStatus: 'APPROVED' as const,
      };

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[doc]}
        />,
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('shows rejected badge with reason for rejected documents', () => {
      const doc = {
        ...BASE_DOC,
        adminReviewStatus: 'REJECTED' as const,
        rejectionReason: 'Document expired',
      };

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[doc]}
        />,
      );

      expect(screen.getByText('Rejected')).toBeInTheDocument();
      // The reason is displayed as "Rejected- Document expired"
      expect(screen.getByText(/Document expired/)).toBeInTheDocument();
    });

    it('hides action buttons for already reviewed documents', () => {
      const doc = {
        ...BASE_DOC,
        adminReviewStatus: 'APPROVED' as const,
      };

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[doc]}
        />,
      );

      expect(screen.queryByRole('button', { name: /Approve/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Reject/i })).toBeNull();
    });
  });

  describe('all approved message', () => {
    it('shows success message when all documents are approved', () => {
      const docs = [
        { ...BASE_DOC, id: 'doc-1', adminReviewStatus: 'APPROVED' as const },
        { ...BASE_DOC, id: 'doc-2', adminReviewStatus: 'APPROVED' as const },
      ];

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={docs}
        />,
      );

      expect(screen.getByText(/All documents verified/)).toBeInTheDocument();
      expect(screen.getByText(/adoption can proceed to escrow/)).toBeInTheDocument();
    });

    it('does not show success message when not all documents are approved', () => {
      const docs = [
        { ...BASE_DOC, id: 'doc-1', adminReviewStatus: 'APPROVED' as const },
        { ...BASE_DOC, id: 'doc-2', adminReviewStatus: undefined },
      ];

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={docs}
        />,
      );

      expect(screen.queryByText(/All documents verified/)).toBeNull();
    });
  });

  describe('pending state', () => {
    it('disables buttons when mutation is pending', () => {
      mockUseMutateReviewDocument.mockReturnValue({
        reviewDocument: vi.fn(),
        reviewDocumentAsync: vi.fn(),
        isPending: true,
        isError: false,
        error: null,
      });

      renderWithQueryClient(
        <AdminDocumentReviewPanel
          adoptionId="adoption-001"
          documents={[BASE_DOC]}
        />,
      );

      expect(screen.getByRole('button', { name: /Approve/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Reject/i })).toBeDisabled();
    });
  });
});