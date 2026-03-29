import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '../NotificationItem';
import type { Notification } from '../../../types/notifications';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const escrowNotification: Notification = {
  id: 'notif-001',
  type: 'ESCROW_FUNDED',
  title: 'Escrow Funded',
  message: 'Your escrow has been funded and is ready.',
  time: '2026-03-24T10:00:00.000Z',
  hasArrow: true,
  metadata: { resourceId: 'adoption-001' },
};

const disputeNotification: Notification = {
  id: 'notif-002',
  type: 'DISPUTE_RAISED',
  title: 'Dispute Raised',
  message: 'A dispute has been opened on your adoption.',
  time: '2026-03-24T14:00:00.000Z',
  hasArrow: true,
  metadata: { resourceId: 'dispute-001' },
};

const approvalNotification: Notification = {
  id: 'notif-003',
  type: 'APPROVAL_REQUESTED',
  title: 'Approval Requested',
  message: 'Someone is waiting for your approval.',
  time: '2026-03-24T11:30:00.000Z',
  hasArrow: true,
  metadata: { resourceId: 'adoption-002' },
};

const documentNotification: Notification = {
  id: 'notif-004',
  type: 'DOCUMENT_EXPIRING',
  title: 'Document Expiring Soon',
  message: 'Your certificate expires in 7 days.',
  time: '2026-03-25T08:00:00.000Z',
  hasArrow: false,
  metadata: { resourceId: 'adoption-001' },
};

const legacyNotification: Notification = {
  id: 5,
  type: 'success',
  title: 'Payment Successful',
  message: 'Your payment has been confirmed.',
  time: '2 min ago',
  hasArrow: false,
};

function renderItem(
  notification: Notification,
  isRead: boolean,
  onRead = vi.fn(),
) {
  return render(
    <NotificationItem
      notification={notification}
      isRead={isRead}
      onRead={onRead}
    />,
  );
}

describe('NotificationItem', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('unread state', () => {
    it('applies orange background when isRead is false', () => {
      const { container } = renderItem(escrowNotification, false);
      const row = container.firstChild as HTMLElement;
      expect(row.className).toContain('bg-orange-50');
    });

    it('renders title in bold when unread', () => {
      renderItem(escrowNotification, false);
      const title = screen.getByTestId('notification-title');
      expect(title.className).toContain('font-bold');
      expect(title.className).not.toContain('font-medium');
    });

    it('shows the unread dot when isRead is false', () => {
      renderItem(escrowNotification, false);
      const dot = screen.getByTestId('unread-dot');
      expect(dot.className).toContain('bg-orange-500');
      expect(dot.className).not.toContain('invisible');
    });

    it('exposes aria-label that includes "Unread"', () => {
      renderItem(escrowNotification, false);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('Unread');
    });
  });

  describe('read state', () => {
    it('applies white background when isRead is true', () => {
      const { container } = renderItem(escrowNotification, true);
      const row = container.firstChild as HTMLElement;
      expect(row.className).toContain('bg-white');
      expect(row.className).not.toContain('bg-orange-50');
    });

    it('renders title with regular weight when read', () => {
      renderItem(escrowNotification, true);
      const title = screen.getByTestId('notification-title');
      expect(title.className).toContain('font-medium');
      expect(title.className).not.toContain('font-bold');
    });

    it('hides the unread dot when isRead is true', () => {
      renderItem(escrowNotification, true);
      const dot = screen.getByTestId('unread-dot');
      expect(dot.className).toContain('invisible');
    });

    it('exposes aria-label that includes "Read"', () => {
      renderItem(escrowNotification, true);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('Read');
    });
  });

  describe('click behaviour', () => {
    it('calls onRead with the notification id on click', () => {
      const onRead = vi.fn();
      renderItem(escrowNotification, false, onRead);
      fireEvent.click(screen.getByRole('button'));
      expect(onRead).toHaveBeenCalledTimes(1);
      expect(onRead).toHaveBeenCalledWith('notif-001');
    });

    it('navigates via notificationRouter on click', () => {
      renderItem(escrowNotification, false);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/adoption/adoption-001/settlement');
    });

    it('calls onRead before navigating (order matters)', () => {
      const callOrder: string[] = [];
      const onRead = vi.fn(() => callOrder.push('onRead'));
      mockNavigate.mockImplementation(() => callOrder.push('navigate'));

      renderItem(escrowNotification, false, onRead);
      fireEvent.click(screen.getByRole('button'));

      expect(callOrder).toEqual(['onRead', 'navigate']);
    });

    it('navigates to dispute route for DISPUTE_RAISED type', () => {
      renderItem(disputeNotification, false);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/disputes/dispute-001');
    });

    it('navigates to approval route for APPROVAL_REQUESTED type', () => {
      renderItem(approvalNotification, false);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/adoption/adoption-002#approvals');
    });

    it('falls back to /notifications for unrouted types', () => {
      renderItem(legacyNotification, false);
      fireEvent.click(screen.getByRole('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('keyboard activation', () => {
    it('triggers onRead and navigate when Enter is pressed', () => {
      const onRead = vi.fn();
      renderItem(escrowNotification, false, onRead);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(onRead).toHaveBeenCalledWith('notif-001');
      expect(mockNavigate).toHaveBeenCalledWith('/adoption/adoption-001/settlement');
    });

    it('triggers onRead and navigate when Space is pressed', () => {
      const onRead = vi.fn();
      renderItem(escrowNotification, false, onRead);
      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(onRead).toHaveBeenCalledWith('notif-001');
      expect(mockNavigate).toHaveBeenCalledWith('/adoption/adoption-001/settlement');
    });

    it('does NOT trigger on other keys', () => {
      const onRead = vi.fn();
      renderItem(escrowNotification, false, onRead);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
      expect(onRead).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('icon mapping (templateId → type)', () => {
    it('uses teal icon wrapper for ESCROW_FUNDED (chain icon)', () => {
      renderItem(escrowNotification, false);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper.className).toContain('bg-teal-100');
    });

    it('uses red icon wrapper for DISPUTE_RAISED (alert icon)', () => {
      renderItem(disputeNotification, false);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper.className).toContain('bg-red-100');
    });

    it('uses green icon wrapper for APPROVAL_REQUESTED (check icon)', () => {
      renderItem(approvalNotification, false);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper.className).toContain('bg-green-100');
    });

    it('uses amber icon wrapper for DOCUMENT_EXPIRING (clock icon)', () => {
      renderItem(documentNotification, false);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper.className).toContain('bg-amber-100');
    });

    it('uses gray icon wrapper for unmapped legacy types (bell icon)', () => {
      renderItem(legacyNotification, false);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper.className).toContain('bg-gray-100');
    });
  });

  describe('timestamp display', () => {
    it('shows relative time from an ISO timestamp', () => {
      const recentTime = new Date(Date.now() - 5 * 60_000).toISOString();
      const notification: Notification = { ...escrowNotification, time: recentTime };
      renderItem(notification, false);
      const timeEl = screen.getByRole('button').querySelector('time');
      expect(timeEl?.textContent).toMatch(/\d+ minutes? ago|just now/);
    });

    it('adds an absolute time as the title tooltip for ISO timestamps', () => {
      renderItem(escrowNotification, false);
      const timeEl = screen.getByRole('button').querySelector('time');
      expect(timeEl?.hasAttribute('title')).toBe(true);
      expect(timeEl?.getAttribute('title')).not.toBe('');
    });

    it('sets dateTime attribute to the raw time value', () => {
      renderItem(escrowNotification, false);
      const timeEl = screen.getByRole('button').querySelector('time');
      expect(timeEl?.getAttribute('dateTime')).toBe('2026-03-24T10:00:00.000Z');
    });

    it('displays plain-string time as-is without a tooltip', () => {
      renderItem(legacyNotification, false);
      const timeEl = screen.getByRole('button').querySelector('time');
      expect(timeEl?.textContent).toBe('2 min ago');
      expect(timeEl?.hasAttribute('title')).toBe(false);
    });
  });

  describe('content rendering', () => {
    it('renders the notification title', () => {
      renderItem(escrowNotification, false);
      expect(screen.getByText('Escrow Funded')).toBeTruthy();
    });

    it('renders the notification message', () => {
      renderItem(escrowNotification, false);
      expect(screen.getByText('Your escrow has been funded and is ready.')).toBeTruthy();
    });

    it('renders a chevron when hasArrow is true', () => {
      const { container } = renderItem(escrowNotification, false);
      const svg = container.querySelector('svg[aria-hidden="true"]:last-of-type');
      expect(svg).toBeTruthy();
    });

    it('does NOT render a chevron when hasArrow is false', () => {
      const { container } = renderItem(documentNotification, false);
      const row = container.firstChild as HTMLElement;
      const svgs = row.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });
  });
});