// components/__tests__/DisputeStatusBadge.test.tsx

import React from 'react'
import { render } from '@testing-library/react'
import { DisputeStatusBadge } from '../../pages/DisputeStatusBadge'
import type { DisputeStatus } from '../../types/dispute.types'

describe('DisputeStatusBadge', () => {
  const statuses: DisputeStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'SLA_BREACHED']

  statuses.forEach((status) => {
    it(`renders correctly for ${status} status`, () => {
      const { container } = render(<DisputeStatusBadge status={status} />)
      expect(container).toMatchSnapshot()
    })
  })

  it('renders all status values', () => {
    const { container } = render(
      <div>
        {statuses.map((status) => (
          <DisputeStatusBadge key={status} status={status} />
        ))}
      </div>
    )
    expect(container).toMatchSnapshot()
  })
})