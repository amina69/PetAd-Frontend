import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UploadQuotaIndicator } from './UploadQuotaIndicator'

const MB = 1024 * 1024

describe('UploadQuotaIndicator — color thresholds', () => {
  it('renders green bar when usage is below 80%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={70 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-green-500')
  })

  it('renders amber bar at exactly 80%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={80 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-amber-500')
  })

  it('renders amber bar between 80% and 95%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={90 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-amber-500')
  })

  it('renders red bar at exactly 95%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={95 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-red-500')
  })

  it('renders red bar above 95%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={99 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-red-500')
  })

  it('renders red bar at 100%', () => {
    const { container } = render(
      <UploadQuotaIndicator usedBytes={100 * MB} totalBytes={100 * MB} />
    )
    const bar = container.querySelector('[role="progressbar"] > div')
    expect(bar?.className).toContain('bg-red-500')
  })
})

describe('UploadQuotaIndicator — text formatting', () => {
  it('displays whole MB numbers without decimals', () => {
    render(<UploadQuotaIndicator usedBytes={50 * MB} totalBytes={100 * MB} />)
    expect(screen.getByText('50 MB of 100 MB used')).toBeTruthy()
  })

  it('displays fractional MB with one decimal place', () => {
    render(<UploadQuotaIndicator usedBytes={1.5 * MB} totalBytes={10 * MB} />)
    expect(screen.getByText('1.5 MB of 10 MB used')).toBeTruthy()
  })

  it('displays 0 MB when nothing is used', () => {
    render(<UploadQuotaIndicator usedBytes={0} totalBytes={100 * MB} />)
    expect(screen.getByText('0 MB of 100 MB used')).toBeTruthy()
  })
})

describe('UploadQuotaIndicator — progressbar aria attributes', () => {
  it('sets aria-valuenow to the current percentage', () => {
    render(<UploadQuotaIndicator usedBytes={75 * MB} totalBytes={100 * MB} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('75')
  })

  it('caps aria-valuenow at 100 when over limit', () => {
    render(<UploadQuotaIndicator usedBytes={110 * MB} totalBytes={100 * MB} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('UploadQuotaIndicator — upload button disabled at 100%', () => {
  it('does not render a button when onUpload is not provided', () => {
    render(<UploadQuotaIndicator usedBytes={50 * MB} totalBytes={100 * MB} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders an enabled button below quota', () => {
    const onUpload = vi.fn()
    render(
      <UploadQuotaIndicator
        usedBytes={50 * MB}
        totalBytes={100 * MB}
        onUpload={onUpload}
      />
    )
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(onUpload).toHaveBeenCalledOnce()
  })

  it('disables the button at exactly 100%', () => {
    render(
      <UploadQuotaIndicator
        usedBytes={100 * MB}
        totalBytes={100 * MB}
        onUpload={vi.fn()}
      />
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onUpload when disabled at 100%', () => {
    const onUpload = vi.fn()
    render(
      <UploadQuotaIndicator
        usedBytes={100 * MB}
        totalBytes={100 * MB}
        onUpload={onUpload}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows tooltip text "Upload limit reached" when at capacity', () => {
    render(
      <UploadQuotaIndicator
        usedBytes={100 * MB}
        totalBytes={100 * MB}
        onUpload={vi.fn()}
      />
    )
    expect(screen.getByRole('tooltip')).toBeTruthy()
    expect(screen.getByText('Upload limit reached')).toBeTruthy()
  })

  it('does not show tooltip when below capacity', () => {
    render(
      <UploadQuotaIndicator
        usedBytes={50 * MB}
        totalBytes={100 * MB}
        onUpload={vi.fn()}
      />
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('respects a custom uploadLabel', () => {
    render(
      <UploadQuotaIndicator
        usedBytes={10 * MB}
        totalBytes={100 * MB}
        onUpload={vi.fn()}
        uploadLabel="Add Files"
      />
    )
    expect(screen.getByRole('button', { name: 'Add Files' })).toBeTruthy()
  })
})
