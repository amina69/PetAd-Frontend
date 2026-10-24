import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';
import { PageLoader } from '../PageLoader';
import { LoadingOverlay } from '../LoadingOverlay';

// ─── Spinner ──────────────────────────────────────────────────────────

describe('Spinner', () => {
  it('renders with default label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByLabelText('Loading…')).toBeTruthy();
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Saving…" />);
    expect(screen.getByLabelText('Saving…')).toBeTruthy();
  });

  it('applies size class for sm', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByTestId('spinner').className).toContain('h-4');
  });

  it('applies size class for lg', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner').className).toContain('h-10');
  });

  it('forwards extra className', () => {
    render(<Spinner className="ml-2" />);
    expect(screen.getByTestId('spinner').className).toContain('ml-2');
  });
});

// ─── PageLoader ───────────────────────────────────────────────────────

describe('PageLoader', () => {
  it('renders the wrapper', () => {
    render(<PageLoader />);
    expect(screen.getByTestId('page-loader')).toBeTruthy();
  });

  it('renders a spinner with default label', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status', { name: 'Loading page…' })).toBeTruthy();
  });

  it('passes custom label to spinner', () => {
    render(<PageLoader label="Loading pets…" />);
    expect(screen.getByRole('status', { name: 'Loading pets…' })).toBeTruthy();
  });
});

// ─── LoadingOverlay ───────────────────────────────────────────────────

describe('LoadingOverlay', () => {
  it('renders nothing when visible=false', () => {
    render(<LoadingOverlay visible={false} />);
    expect(screen.queryByTestId('loading-overlay')).toBeNull();
  });

  it('renders when visible=true', () => {
    render(<LoadingOverlay visible />);
    expect(screen.getByTestId('loading-overlay')).toBeTruthy();
  });

  it('renders a spinner with default label', () => {
    render(<LoadingOverlay visible />);
    expect(screen.getByRole('status', { name: 'Processing…' })).toBeTruthy();
  });

  it('passes custom label to spinner', () => {
    render(<LoadingOverlay visible label="Uploading…" />);
    expect(screen.getByRole('status', { name: 'Uploading…' })).toBeTruthy();
  });
});
