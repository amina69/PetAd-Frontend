import type { DisputeStatus } from '../types/dispute.types';

export interface DisputeStatusConfig {
  label: string;
  description: string;
  colorVariant: 'red' | 'amber' | 'green' | 'gray';
  hasPulse?: boolean;
}

export const DISPUTE_STATUS_CONFIG: Record<DisputeStatus, DisputeStatusConfig> = {
  OPEN: {
    label: 'Open',
    description: 'Dispute has been created and awaits review.',
    colorVariant: 'red',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Dispute is currently being reviewed.',
    colorVariant: 'amber',
  },
  RESOLVED: {
    label: 'Resolved',
    description: 'Dispute has been resolved successfully.',
    colorVariant: 'green',
  },
  CLOSED: {
    label: 'Closed',
    description: 'Dispute has been closed.',
    colorVariant: 'gray',
  },
  SLA_BREACHED: {
    label: 'SLA Breached',
    description: 'Resolution SLA time has been exceeded.',
    colorVariant: 'red',
    hasPulse: true,
  },
};


  // Issues Implemented

