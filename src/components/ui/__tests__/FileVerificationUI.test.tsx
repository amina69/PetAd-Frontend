import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FileVerificationUI } from '../FileVerificationUI';
import { useApiQuery } from '../../../hooks/useApiQuery';

vi.mock('../../../hooks/useApiQuery');
vi.mock('../../../api/documentService');

describe('FileVerificationUI', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows skeleton loader when loading', () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <FileVerificationUI
        adoptionId="a-1"
        currentUserId="u-1"
        currentUserRole="USER"
      />
    );

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('shows empty state when no documents', () => {
    (useApiQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <FileVerificationUI
        adoptionId="a-1"
        currentUserId="u-1"
        currentUserRole="USER"
      />
    );

    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
  });

  it('shows add button for owner even if empty', () => {
    (useApiQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <FileVerificationUI
        adoptionId="a-1"
        currentUserId="u-1"
        currentUserRole="USER"
        isOwner={true}
      />
    );

    expect(screen.getByRole('button', { name: /Add document/i })).toBeInTheDocument();
  });

  it('shows document rows when data is available', () => {
    const mockDocs = [
      {
        id: 'doc-1',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        createdAt: new Date().toISOString(),
        onChainVerified: true,
      },
    ];

    (useApiQuery as any).mockReturnValue({
      data: mockDocs,
      isLoading: false,
    });

    render(
      <FileVerificationUI
        adoptionId="a-1"
        currentUserId="u-1"
        currentUserRole="USER"
      />
    );

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });
});
