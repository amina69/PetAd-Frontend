import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EscrowStatusBadge } from './EscrowStatusBadge'

const cases = [
  { status: 'CREATED',           label: 'Created',           variantClass: 'status-badge--gray' },
  { status: 'FUNDED',            label: 'Funded',            variantClass: 'status-badge--blue' },
  { status: 'CONFIRMED',         label: 'Confirmed',         variantClass: 'status-badge--teal' },
  { status: 'SETTLING',          label: 'Settling',          variantClass: 'status-badge--amber' },
  { status: 'SETTLED',           label: 'Settled',           variantClass: 'status-badge--green' },
  { status: 'SETTLEMENT_FAILED', label: 'Settlement Failed', variantClass: 'status-badge--red'  },
  { status: 'DISPUTED',          label: 'Disputed',          variantClass: 'status-badge--red'  },
  { status: 'NOT_FOUND',         label: 'Not Found',         variantClass: 'status-badge--gray' },
]

describe('EscrowStatusBadge — snapshot test for every status', () => {
  it.each(cases)('renders $status correctly', ({ status, label, variantClass }) => {
    const { container } = render(<EscrowStatusBadge status={status} />)

    // 1. Label is visible — getByText throws if not found, so finding it IS the assertion
    const labelNode = screen.getByText(label)
    expect(labelNode).toBeTruthy()

    // 2. Correct colour variant applied
    const pill = labelNode.closest('.status-badge') as HTMLElement | null
    expect(pill).toBeTruthy()
    expect(pill?.className).toContain(variantClass)

    // 3. Tooltip exists in the DOM
    const tooltip = container.querySelector('.status-badge__tooltip')
    expect(tooltip).not.toBeNull()

    // 4. Snapshot
    expect(container).toMatchSnapshot()
  })

  it('falls back to NOT_FOUND for an unknown status', () => {
    render(<EscrowStatusBadge status="WHATEVER" />)
    expect(screen.getByText('Not Found')).toBeTruthy()
  })
})
