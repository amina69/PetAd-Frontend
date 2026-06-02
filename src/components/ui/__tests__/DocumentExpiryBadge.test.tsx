import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentExpiryBadge } from '../DocumentExpiryBadge';

describe('DocumentExpiryBadge', () => {
  it('renders nothing when expiresAt is null', () => {
    const { container } = render(<DocumentExpiryBadge expiresAt={null} status="APPROVED" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders red badge when document is expired', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expiresAt = yesterday.toISOString();

    const { container } = render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(screen.getByText('Expired — re-upload required')).toBeTruthy();
    const badge = container.querySelector('.status-badge--red');
    expect(badge).toBeTruthy();

    const tooltip = container.querySelector('.status-badge__tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain('Expired on');
  });

  it('renders amber badge when expiring in 7 days', () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiresAt = sevenDaysFromNow.toISOString();

    const { container } = render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(screen.getByText('Expiring in 7 days')).toBeTruthy();
    const badge = container.querySelector('.status-badge--amber');
    expect(badge).toBeTruthy();

    const tooltip = container.querySelector('.status-badge__tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain('Expires on');
  });

  it('renders amber badge when expiring in 1 day with singular label', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expiresAt = tomorrow.toISOString();

    const { container } = render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(screen.getByText('Expiring in 1 day')).toBeTruthy();
    const badge = container.querySelector('.status-badge--amber');
    expect(badge).toBeTruthy();
  });

  it('renders amber badge when expiring in 3 days', () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiresAt = threeDaysFromNow.toISOString();

    render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(screen.getByText('Expiring in 3 days')).toBeTruthy();
  });

  it('renders nothing when expiring in more than 7 days', () => {
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
    const expiresAt = eightDaysFromNow.toISOString();

    const { container } = render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when expiring in 30 days', () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiresAt = thirtyDaysFromNow.toISOString();

    const { container } = render(<DocumentExpiryBadge expiresAt={expiresAt} status="APPROVED" />);

    expect(container.firstChild).toBeNull();
  });
});
