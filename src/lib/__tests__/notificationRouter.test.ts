import { describe, it, expect } from 'vitest';
import { notificationRouter } from '../notificationRouter';
import type { Notification } from '../../types/notifications';

describe('notificationRouter', () => {
  it('should return correct route for APPROVAL_REQUESTED', () => {
    const notification: Notification = {
      id: '1',
      type: 'APPROVAL_REQUESTED',
      title: 'Approval Requested',
      message: 'Someone wants to adopt',
      time: 'now',
      metadata: { resourceId: '123' }
    };
    expect(notificationRouter(notification)).toBe('/adoption/123#approvals');
  });

  it('should return correct route for ESCROW_FUNDED', () => {
    const notification: Notification = {
      id: '2',
      type: 'ESCROW_FUNDED',
      title: 'Escrow Funded',
      message: 'Payment received',
      time: 'now',
      metadata: { resourceId: '456' }
    };
    expect(notificationRouter(notification)).toBe('/adoption/456/settlement');
  });

  it('should return correct route for DISPUTE_RAISED', () => {
    const notification: Notification = {
      id: '3',
      type: 'DISPUTE_RAISED',
      title: 'Dispute Raised',
      message: 'An issue was reported',
      time: 'now',
      metadata: { resourceId: '789' }
    };
    expect(notificationRouter(notification)).toBe('/disputes/789');
  });

  it('should return correct route for SETTLEMENT_COMPLETE', () => {
    const notification: Notification = {
      id: '4',
      type: 'SETTLEMENT_COMPLETE',
      title: 'Settlement Complete',
      message: 'Process finished',
      time: 'now',
      metadata: { resourceId: '1011' }
    };
    expect(notificationRouter(notification)).toBe('/adoption/1011/settlement');
  });

  it('should return correct route for DOCUMENT_EXPIRING', () => {
    const notification: Notification = {
      id: '5',
      type: 'DOCUMENT_EXPIRING',
      title: 'Document Expiring',
      message: 'Please update your docs',
      time: 'now',
      metadata: { resourceId: '1213' }
    };
    expect(notificationRouter(notification)).toBe('/adoption/1213/documents');
  });

  it('should return correct route for CUSTODY_EXPIRING', () => {
    const notification: Notification = {
      id: '6',
      type: 'CUSTODY_EXPIRING',
      title: 'Custody Expiring',
      message: 'Time is running out',
      time: 'now',
      metadata: { resourceId: '1415' }
    };
    expect(notificationRouter(notification)).toBe('/custody/1415');
  });

  it('should return default route for unknown type', () => {
    const notification = {
      id: '7',
      type: 'UNKNOWN_TYPE',
      message: 'Test message',
      time: 'now',
    } as unknown as Notification;
    expect(notificationRouter(notification)).toBe('/notifications');
  });
});
