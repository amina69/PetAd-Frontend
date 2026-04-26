import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DocumentRow } from '../DocumentRow';
import type { Document } from '../../../types/documents';

const BASE_DOC: Document = {
  id: 'doc-001',
  fileName: 'vaccination-certificate.pdf',
  fileUrl: 'https://example.com/docs/vaccination-certificate.pdf',
  mimeType: 'application/pdf',
  size: 102400,
  uploadedById: 'user-owner',
  adoptionId: 'adoption-001',
  createdAt: '2026-01-15T08:00:00.000Z',
  onChainVerified: null,
  anchorTxHash: null,
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

describe('DocumentRow — file info', () => {
  it('renders the filename', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('vaccination-certificate.pdf')).toBeInTheDocument();
  });

  it('renders the file size', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/100 KB/)).toBeInTheDocument();
  });

  it('renders the uploaded date', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
  });

  it('renders a PDF icon for pdf mimeType', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('PDF')).toBeInTheDocument();
  });

  it('renders an image icon for image mimeType', () => {
    renderWithQueryClient(
      <DocumentRow
        document={{ ...BASE_DOC, mimeType: 'image/jpeg' }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('JPEG')).toBeInTheDocument();
  });
});

describe('DocumentRow — integrity badge', () => {
  it('renders unverified integrity badge when onChainVerified is null', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('renders verified integrity badge when onChainVerified is true', () => {
    renderWithQueryClient(
      <DocumentRow
        document={{
          ...BASE_DOC,
          onChainVerified: true,
          anchorTxHash: 'abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123',
        }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument();
  });

  it('renders integrity failed badge when onChainVerified is false', () => {
    renderWithQueryClient(
      <DocumentRow
        document={{ ...BASE_DOC, onChainVerified: false }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Integrity failed')).toBeInTheDocument();
  });
});

describe('DocumentRow — expiry badge', () => {
  it('renders no expiry badge when expiresAt is null', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Expir/)).not.toBeInTheDocument();
  });

  it('renders expired badge when expiresAt is in the past', () => {
    renderWithQueryClient(
      <DocumentRow
        document={{ ...BASE_DOC, expiresAt: '2020-01-01T00:00:00.000Z' }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders expiring soon badge when expiresAt is within 30 days', () => {
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    render(
      <DocumentRow
        document={{ ...BASE_DOC, expiresAt: soon }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Expiring soon')).toBeInTheDocument();
  });

  it('renders expiry date badge when expiresAt is beyond 30 days', () => {
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    render(
      <DocumentRow
        document={{ ...BASE_DOC, expiresAt: future }}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
  });
});

describe('DocumentRow — download link', () => {
  it('renders a download link with correct href', () => {
    render(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /Download vaccination-certificate.pdf/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', BASE_DOC.fileUrl);
  });
});

describe('DocumentRow — delete button visibility', () => {
  it('shows delete button for document owner', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Delete vaccination-certificate.pdf/ })).toBeInTheDocument();
  });

  it('shows delete button for ADMIN regardless of ownership', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-other"
        currentUserRole="ADMIN"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Delete vaccination-certificate.pdf/ })).toBeInTheDocument();
  });

  it('does not show delete button for non-owner non-admin', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-other"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('does not show delete button for SHELTER who is not the owner', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-shelter"
        currentUserRole="SHELTER"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });
});

describe('DocumentRow — delete confirmation', () => {
  it('shows confirmation UI after clicking delete', () => {
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Delete vaccination-certificate.pdf/ }));
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onDelete with the document id on confirm', () => {
    const onDelete = vi.fn();
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Delete vaccination-certificate.pdf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith('doc-001');
  });

  it('dismisses confirmation and does not call onDelete on cancel', () => {
    const onDelete = vi.fn();
    renderWithQueryClient(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-owner"
        currentUserRole="USER"
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Delete vaccination-certificate.pdf/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete this file?')).not.toBeInTheDocument();
  });
});
