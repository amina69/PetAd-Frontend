import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleBadge } from '../RoleBadge'
import type { UserRole } from '../../../types/auth'

const cases: { role: UserRole; textClass: string; bgClass: string }[] = [
  { role: 'ADMIN', textClass: 'text-purple-700', bgClass: 'bg-purple-100' },
  { role: 'SHELTER', textClass: 'text-teal-700', bgClass: 'bg-teal-100' },
  { role: 'USER', textClass: 'text-gray-700', bgClass: 'bg-gray-100' },
]

describe('RoleBadge', () => {
  it.each(cases)('renders $role correctly', ({ role, textClass, bgClass }) => {
    const { container } = render(<RoleBadge role={role} />)

    const badge = screen.getByText(role)
    expect(badge).toBeTruthy()
    expect(badge.className).toContain(textClass)
    expect(badge.className).toContain(bgClass)

    expect(container).toMatchSnapshot()
  })
})
