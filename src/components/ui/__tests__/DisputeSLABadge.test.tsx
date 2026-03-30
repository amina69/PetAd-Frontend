import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisputeSLABadge } from '../DisputeSLABadge';

describe('DisputeSLABadge', () => {
  // Use a fixed baseline date: Friday, March 27, 2026, 12:00:00 PM
  const MOCK_NOW = new Date('2026-03-27T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null (renders nothing) when dispute is < 48h old', () => {
    // 47 hours ago
    const createdAt = new Date(MOCK_NOW.getTime() - 47 * 60 * 60 * 1000).toISOString();
    const { container } = render(<DisputeSLABadge createdAt={createdAt} status="open" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Due soon" (Amber) when dispute is between 48h and 72h old', () => {
    // Exactly 48 hours ago
    const createdAt48h = new Date(MOCK_NOW.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const { rerender } = render(<DisputeSLABadge createdAt={createdAt48h} status="open" />);
    
    let badge = screen.getByText('Due soon');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-amber-700');
    expect(screen.getByText('48 hours elapsed')).toBeInTheDocument();

    // Exactly 72 hours ago
    const createdAt72h = new Date(MOCK_NOW.getTime() - 72 * 60 * 60 * 1000).toISOString();
    rerender(<DisputeSLABadge createdAt={createdAt72h} status="under_review" />);
    
    badge = screen.getByText('Due soon');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-amber-700');
    expect(screen.getByText('72 hours elapsed')).toBeInTheDocument();
  });

  it('renders "SLA breached" (Red) when dispute is > 72h old', () => {
    // 73 hours ago
    const createdAt = new Date(MOCK_NOW.getTime() - 73 * 60 * 60 * 1000).toISOString();
    render(<DisputeSLABadge createdAt={createdAt} status="open" />);
    
    const badge = screen.getByText('SLA breached');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-red-700');
    expect(screen.getByText('73 hours elapsed')).toBeInTheDocument();
  });

  it('returns null when dispute is resolved, regardless of age', () => {
    // 100 hours ago but resolved
    const createdAt = new Date(MOCK_NOW.getTime() - 100 * 60 * 60 * 1000).toISOString();
    const { container } = render(<DisputeSLABadge createdAt={createdAt} status="resolved" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when dispute is closed, regardless of age', () => {
    // 100 hours ago but closed
    const createdAt = new Date(MOCK_NOW.getTime() - 100 * 60 * 60 * 1000).toISOString();
    const { container } = render(<DisputeSLABadge createdAt={createdAt} status="closed" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null if createdAt is invalid', () => {
    const { container } = render(<DisputeSLABadge createdAt="not-a-date" status="open" />);
    expect(container.firstChild).toBeNull();
  });
});
