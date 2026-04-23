import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DocumentRow } from '../DocumentRow';
import { documentService } from '../../../api/documentService';
import type { Document } from '../../../types/documents';

vi.mock('../../../api/documentService');

const BASE_DOC: Document = {
  id: 'doc-001',
  fileName: 'test.pdf',
  fileUrl: 'https://example.com/test.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  uploadedById: 'user-1',
  adoptionId: 'a-1',
  createdAt: new Date().toISOString(),
  onChainVerified: null, // This triggers lazy verification
  anchorTxHash: null,
  expiresAt: null,
};

describe('DocumentRow Lazy Verification', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls verifyDocument on mount if onChainVerified is null', async () => {
    (documentService.verifyDocument as any).mockResolvedValue({
      verified: true,
      hash: 'hash-123',
    });

    render(
      <DocumentRow
        document={BASE_DOC}
        currentUserId="user-1"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Unverified')).toBeInTheDocument();

    await waitFor(() => {
      expect(documentService.verifyDocument).toHaveBeenCalledWith('doc-001');
    });

    await waitFor(() => {
      expect(screen.getByText('Verified on Stellar')).toBeInTheDocument();
    });
  });

  it('does not call verifyDocument if onChainVerified is already set', () => {
    render(
      <DocumentRow
        document={{ ...BASE_DOC, onChainVerified: true }}
        currentUserId="user-1"
        currentUserRole="USER"
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument();
    expect(documentService.verifyDocument).not.toHaveBeenCalled();
  });
});
