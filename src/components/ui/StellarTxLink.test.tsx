import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { stellarExplorerUrl } from '../../lib/stellar';
import { StellarTxLink } from './StellarTxLink';

describe('StellarTxLink', () => {
  const txHash =
    '12345678abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('renders correct Stellar explorer URL and safe external link attributes', () => {
    render(<StellarTxLink txHash={txHash} />);

    const link = screen.getByRole('link', {
      name: 'View transaction on Stellar explorer',
    });

    expect(link.getAttribute('href')).toBe(stellarExplorerUrl(txHash));
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows truncated hash and full hash in tooltip title', () => {
    render(<StellarTxLink txHash={txHash} />);

    const link = screen.getByRole('link', {
      name: 'View transaction on Stellar explorer',
    });
    const expectedTruncation = `${txHash.slice(0, 8)}…${txHash.slice(-8)}`;

    expect(link.textContent).toBe(expectedTruncation);
    expect(link.getAttribute('title')).toBe(txHash);
  });

  it('fires clipboard API with full transaction hash when copy is clicked', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<StellarTxLink txHash={txHash} />);

    const copyButton = screen.getByRole('button', {
      name: 'Copy transaction hash',
    });
    fireEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(txHash);
  });
});