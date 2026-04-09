import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocumentExpiryBadge } from '../DocumentExpiryBadge'

// Mock current date to 2026-03-29 for consistent testing
const MOCK_TODAY = new Date('2026-03-29')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(MOCK_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DocumentExpiryBadge', () => {
  describe('null expiresAt', () => {
    it('renders nothing when expiresAt is null', () => {
      const { container } = render(
        <DocumentExpiryBadge expiresAt={null} status="test" />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('amber threshold (within 7 days)', () => {
    it('shows amber badge for document expiring in 7 days', () => {
      const expiryDate = new Date('2026-04-05') // 7 days from now
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-amber-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-amber-700')
    })

    it('shows amber badge for document expiring in 1 day', () => {
      const expiryDate = new Date('2026-03-30') // 1 day from now
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-amber-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-amber-700')
    })

    it('shows amber badge for document expiring in 3 days', () => {
      const expiryDate = new Date('2026-04-01') // 3 days from now
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-amber-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-amber-700')
    })

    it('includes AlertCircle icon in amber badge', () => {
      const expiryDate = new Date('2026-04-01')
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      // Lucide icons render as SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('shows correct tooltip for amber badge', () => {
      const expiryDate = new Date('2026-04-01')
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      // Tooltip text should contain the expiry date
      const tooltip = container.querySelector('.group-hover\\:opacity-100')
      expect(tooltip?.textContent).toContain('4/1/2026')
    })
  })

  describe('red threshold (expired)', () => {
    it('shows red badge for expired document', () => {
      const expiryDate = new Date('2026-03-28') // 1 day ago
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-red-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-red-700')
    })

    it('shows red badge for document expired months ago', () => {
      const expiryDate = new Date('2025-12-25') // Months ago
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-red-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-red-700')
    })

    it('includes AlertCircle icon in red badge', () => {
      const expiryDate = new Date('2026-03-28')
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('shows correct tooltip for red badge', () => {
      const expiryDate = new Date('2026-03-15')
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const tooltip = container.querySelector('.group-hover\\:opacity-100')
      expect(tooltip?.textContent).toContain('3/15/2026')
    })
  })

  describe('no badge states', () => {
    it('renders nothing for document expiring in 8+ days', () => {
      const expiryDate = new Date('2026-04-10') // 12 days from now
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders nothing for document expiring far in future', () => {
      const expiryDate = new Date('2027-12-31') // Almost 2 years away
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles document expiring today (0 days)', () => {
      const expiryDate = new Date('2026-03-29') // Today
      const { container } = render(
        <DocumentExpiryBadge
          expiresAt={expiryDate.toISOString()}
          status="test"
        />
      )

      const badgeContainer = container.querySelector('.bg-amber-100')
      expect(badgeContainer).toBeInTheDocument()
      expect(badgeContainer).toHaveClass('text-amber-700')
    })

    it('correctly pluralizes "day" vs "days"', () => {
      // Test with 1 day
      const { unmount: unmount1 } = render(
        <DocumentExpiryBadge
          expiresAt={new Date('2026-03-30').toISOString()}
          status="test"
        />
      )
      expect(screen.getByText(/Expiring in 1 day/)).toBeInTheDocument()
      unmount1()

      // Test with 2 days
      render(
        <DocumentExpiryBadge
          expiresAt={new Date('2026-03-31').toISOString()}
          status="test"
        />
      )
      expect(screen.getByText(/Expiring in 2 days/)).toBeInTheDocument()
    })

    it('accepts ISO string format for expiresAt', () => {
      const isoString = '2026-04-01T10:30:00Z'
      render(
        <DocumentExpiryBadge expiresAt={isoString} status="test" />
      )

      const badge = screen.getByText(/Expiring in 3 days/)
      expect(badge).toBeInTheDocument()
    })
  })
})
