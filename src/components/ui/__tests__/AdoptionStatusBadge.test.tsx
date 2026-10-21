import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { AdoptionStatusBadge } from '../AdoptionStatusBadge'

const cases = [
  { status: 'ESCROW_CREATED', label: 'Escrow Created', variantClass: 'status-badge--gray' },
  { status: 'ESCROW_FUNDED', label: 'Escrow Funded', variantClass: 'status-badge--teal' },
  { status: 'SETTLEMENT_TRIGGERED', label: 'Settlement Triggered', variantClass: 'status-badge--amber' },
  { status: 'CUSTODY_ACTIVE', label: 'Custody Active', variantClass: 'status-badge--green' },
  { status: 'FUNDS_RELEASED', label: 'Funds Released', variantClass: 'status-badge--green' },
  { status: 'COMPLETED', label: 'Completed', variantClass: 'status-badge--green' },
  { status: 'CANCELLED', label: 'Cancelled', variantClass: 'status-badge--gray' },
  { status: 'DISPUTED', label: 'Disputed', variantClass: 'status-badge--red' },
]

describe('AdoptionStatusBadge', () => {
  it.each(cases)('renders $status correctly', ({ status, label, variantClass }) => {
    const { container } = renderWithProviders(<AdoptionStatusBadge status={status} />)

    const labelNode = screen.getByText(label)
    const pill = labelNode.closest('.status-badge') as HTMLElement | null
    expect(pill).toBeTruthy()

    expect(pill?.className).toContain(variantClass)

    const tooltip = container.querySelector('.status-badge__tooltip')
    expect(tooltip).not.toBeNull()

    expect(container).toMatchSnapshot()
  })

  it('fallback works', () => {
    renderWithProviders(<AdoptionStatusBadge status="UNKNOWN" />)
    expect(screen.getByText('Not Found')).toBeTruthy()
  })
})
