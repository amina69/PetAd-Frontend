import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DisputeStatusBadge } from '../DisputeStatusBadge';
import { DISPUTE_STATUS_CONFIG } from '../../constants/disputeStatusConfig';
import type { DisputeStatus } from '../../types/dispute.types';

describe('DisputeStatusBadge', () => {
  const statuses: DisputeStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'SLA_BREACHED'];

  describe('Snapshots for all statuses', () => {
    statuses.forEach((status) => {
      it(`matches snapshot for ${status}`, () => {
        const { container } = render(<DisputeStatusBadge status={status} />);
        expect(container.firstChild).toMatchSnapshot();
      });
    });
  });

  describe('Behavior and rendering', () => {
    statuses.forEach((status) => {
      it(`renders correct label and tooltip for ${status}`, () => {
        render(<DisputeStatusBadge status={status} />);
        const config = DISPUTE_STATUS_CONFIG[status];
        
        // Find badge by test id
        const badge = screen.getByTestId(`dispute-badge-${status}`);
        
        // Check label
        expect(badge).toHaveTextContent(config.label);
        
        // Check tooltip description is present
        expect(badge).toHaveTextContent(config.description);
        
        // Check aria-label
        expect(badge).toHaveAttribute('aria-label', `${config.label}: ${config.description}`);
      });
    });

    it('applies pulse animation class ONLY for SLA_BREACHED', () => {
      render(
        <>
          <DisputeStatusBadge status="OPEN" />
          <DisputeStatusBadge status="SLA_BREACHED" />
        </>
      );
      
      const openBadge = screen.getByTestId('dispute-badge-OPEN');
      const slaBadge = screen.getByTestId('dispute-badge-SLA_BREACHED');
      
      expect(openBadge).not.toHaveClass('animate-pulse');
      expect(slaBadge).toHaveClass('animate-pulse');
    });
    
    it('is keyboard accessible', () => {
      render(<DisputeStatusBadge status="OPEN" />);
      const badge = screen.getByTestId('dispute-badge-OPEN');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });
  });
});

  // Issues Implemented
  