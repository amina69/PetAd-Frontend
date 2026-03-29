import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdoptionStatusBadge } from '../AdoptionStatusBadge'

const cases = [
  { status: 'ESCROW_CREATED', label: 'Escrow Created', textClass: 'text-gray-700' },
  { status: 'ESCROW_FUNDED', label: 'Escrow Funded', textClass: 'text-teal-700' },
  { status: 'SETTLEMENT_TRIGGERED', label: 'Settlement Triggered', textClass: 'text-amber-700' },
  { status: 'CUSTODY_ACTIVE', label: 'Custody Active', textClass: 'text-green-700' },
  { status: 'FUNDS_RELEASED', label: 'Funds Released', textClass: 'text-green-700' },
  { status: 'COMPLETED', label: 'Completed', textClass: 'text-emerald-700' },
  { status: 'CANCELLED', label: 'Cancelled', textClass: 'text-slate-700' },
  { status: 'DISPUTED', label: 'Disputed', textClass: 'text-red-700' },
]

describe('AdoptionStatusBadge', () => {
  it.each(cases)('renders $status correctly', ({ status, label, textClass }) => {
    const { container } = render(<AdoptionStatusBadge status={status} />)

    const pill = screen.getByText(label)
    expect(pill).toBeTruthy()

    expect(pill.className).toContain(textClass)

    const tooltip = container.querySelector('[class*="rounded-md"]')
    expect(tooltip).not.toBeNull()

    expect(container).toMatchSnapshot()
  })

  it('fallback works', () => {
    render(<AdoptionStatusBadge status="UNKNOWN" />)
    expect(screen.getByText('Not Found')).toBeTruthy()
  })
})
