import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EscrowStatusBadge } from './EscrowStatusBadge'

const cases = [
  { status: 'CREATED',           label: 'Created',           textClass: 'text-gray-700' },
  { status: 'FUNDED',            label: 'Funded',            textClass: 'text-blue-700' },
  { status: 'CONFIRMED',         label: 'Confirmed',         textClass: 'text-teal-700' },
  { status: 'SETTLING',          label: 'Settling',          textClass: 'text-amber-700' },
  { status: 'SETTLED',           label: 'Settled',           textClass: 'text-green-700' },
  { status: 'SETTLEMENT_FAILED', label: 'Settlement Failed', textClass: 'text-red-700'  },
  { status: 'DISPUTED',          label: 'Disputed',          textClass: 'text-red-700'  },
  { status: 'NOT_FOUND',         label: 'Not Found',         textClass: 'text-gray-700' },
]

describe('EscrowStatusBadge — snapshot test for every status', () => {
  it.each(cases)('renders $status correctly', ({ status, label, textClass }) => {
    const { container } = render(<EscrowStatusBadge status={status} />)

    // 1. Label is visible — getByText throws if not found, so finding it IS the assertion
    const pill = screen.getByText(label)
    expect(pill).toBeTruthy()

    // 2. Correct color class applied
    expect(pill.className).toContain(textClass)

    // 3. Tooltip exists in the DOM
    const tooltip = container.querySelector('[class*="rounded-md"]')
    expect(tooltip).not.toBeNull()

    // 4. Snapshot
    expect(container).toMatchSnapshot()
  })

  it('falls back to NOT_FOUND for an unknown status', () => {
    render(<EscrowStatusBadge status="WHATEVER" />)
    const pill = screen.getByText('Not Found')  
    expect(pill).toBeTruthy()
  })
})