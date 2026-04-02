import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StellarTxLink } from './StellarTxLink';

describe('StellarTxLink', () => {
  const txHash = '12345678abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('renders correct Stellar explorer URL and safe external link attributes', () => {
    render(<StellarTxLink id={txHash} type="tx" />);
    const link = screen.getByTestId('stellar-tx-link');
    expect(link.getAttribute('href')).toBe(`https://stellar.expert/explorer/public/tx/${txHash}`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows truncated label by default', () => {
    render(<StellarTxLink id={txHash} type="tx" />);
    const link = screen.getByTestId('stellar-tx-link');
    const expectedTruncation = `${txHash.slice(0, 8)}…${txHash.slice(-8)}`;
    expect(link.textContent).toBe(expectedTruncation);
  });

  it('shows custom label if provided', () => {
    render(<StellarTxLink id={txHash} type="tx" label="Custom Label" />);
    const link = screen.getByTestId('stellar-tx-link');
    expect(link.textContent).toBe("Custom Label");
  });
});