import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationList } from '../NotificationList';
import type { Notification } from '../../../types/notifications';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Test Notif 1',
    message: 'Message 1',
    time: '2026-03-29T10:00:00Z',
  },
  {
    id: '2',
    type: 'adoption',
    title: 'Test Notif 2',
    message: 'Message 2',
    time: '2026-03-29T11:00:00Z',
  },
];

// Mock useNavigate for NotificationItem
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
})) as any;

describe('NotificationList', () => {
  const onMarkAllRead = vi.fn();
  const onMarkRead = vi.fn();
  const onLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of notifications', () => {
    render(
      <NotificationList
        notifications={mockNotifications}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    expect(screen.getByText('Test Notif 1')).toBeTruthy();
    expect(screen.getByText('Test Notif 2')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('shows empty state when no notifications are provided', () => {
    render(
      <NotificationList
        notifications={[]}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    expect(screen.getByText('You are all caught up!')).toBeTruthy();
    expect(screen.getByText(/You don't have any new notifications/)).toBeTruthy();
  });

  it('calls onMarkAllRead when the "Mark all read" button is clicked', () => {
    render(
      <NotificationList
        notifications={mockNotifications}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    const markAllReadBtn = screen.getByLabelText('Mark all notifications as read');
    fireEvent.click(markAllReadBtn);
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton rows while loading the initial list', () => {
    render(
      <NotificationList
        notifications={[]}
        isFetching={true}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    // Should find multiple skeletons (one for header button, and multiple for items)
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it('triggers onLoadMore when the bottom of the list is reached (IntersectionObserver)', () => {
    let intersectionCallback: any;
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    }) as any;

    render(
      <NotificationList
        notifications={mockNotifications}
        hasNextPage={true}
        onLoadMore={onLoadMore}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    // Simulate intersection entry
    intersectionCallback([{ isIntersecting: true }]);
    
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('renders load more skeletons when hasNextPage is true', () => {
    render(
      <NotificationList
        notifications={mockNotifications}
        hasNextPage={true}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    // Load more skeletons should be visible
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('marks items as read based on readNotificationIds prop', () => {
    const readIds = new Set(['1']);
    render(
      <NotificationList
        notifications={mockNotifications}
        readNotificationIds={readIds}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={onMarkRead}
      />
    );

    // Find the item by title and check if it has the "Read" aria-label (or check the dot)
    const firstItem = screen.getByLabelText(/Read notification: Test Notif 1/i);
    const secondItem = screen.getByLabelText(/Unread notification: Test Notif 2/i);
    
    expect(firstItem).toBeTruthy();
    expect(secondItem).toBeTruthy();
  });
});
