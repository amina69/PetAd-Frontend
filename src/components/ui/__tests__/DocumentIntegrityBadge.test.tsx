import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocumentIntegrityBadge } from '../DocumentIntegrityBadge';

describe('DocumentIntegrityBadge', () => {
  it('renders unverified state for null', () => {
    render(<DocumentIntegrityBadge onChainVerified={null} anchorTxHash={null} />);

    const badge = screen.getByText('Unverified');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-gray-700');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders integrity failed state for false', () => {
    render(
      <DocumentIntegrityBadge
        onChainVerified={false}
        anchorTxHash="abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123"
      />,
    );

    const badge = screen.getByText('Integrity failed');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-red-700');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders verified state and shows StellarTxLink when verified', () => {
    const txHash =
      '12345678abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    render(
      <DocumentIntegrityBadge onChainVerified={true} anchorTxHash={txHash} />,
    );

    const badge = screen.getByText('Verified on Stellar');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-green-700');

    const txLink = screen.getByRole('link', {
      name: 'View transaction on Stellar explorer',
    });
    expect(txLink).toBeInTheDocument();
  });

  it('includes explanation tooltip content', () => {
    render(<DocumentIntegrityBadge onChainVerified={null} anchorTxHash={null} />);

    expect(
      screen.getByText(
        /On-chain verification compares this document fingerprint with the hash anchored on Stellar./i,
      ),
    ).toBeInTheDocument();
  });
});