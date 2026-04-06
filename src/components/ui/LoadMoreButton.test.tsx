import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoadMoreButton } from './LoadMoreButton'

describe('LoadMoreButton', () => {
  it('renders button when hasNextPage is true', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    expect(button).toBeTruthy()
  })

  it('hides button when hasNextPage is false', () => {
    const mockOnLoadMore = vi.fn()
    const { container } = render(
      <LoadMoreButton
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.queryByRole('button', { name: 'Load more results' })
    expect(button).toBeNull()
    expect(container.firstChild).toBeNull()
  })

  it('shows spinner when isFetchingNextPage is true', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    expect(button).toBeTruthy()
    
    // Check that the spinner SVG is present
    const spinner = button.querySelector('svg')
    expect(spinner).toBeTruthy()
    expect(spinner?.className).toContain('animate-spin')
    
    // Check that "Loading..." text is shown
    expect(screen.getByText('Loading...')).toBeTruthy()
  })

  it('shows "Load More" text when not fetching', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    expect(screen.getByText('Load More')).toBeTruthy()
  })

  it('disables button when isFetchingNextPage is true', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    expect(button).toBeDisabled()
  })

  it('calls onLoadMore when clicked', () => {
    const mockOnLoadMore = vi.fn()
    
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    fireEvent.click(button)
    
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not call onLoadMore when disabled by isFetchingNextPage', () => {
    const mockOnLoadMore = vi.fn()
    
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    fireEvent.click(button)
    
    expect(mockOnLoadMore).not.toHaveBeenCalled()
  })

  it('has correct aria-label for accessibility', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    expect(button).toHaveAttribute('aria-label', 'Load more results')
  })

  it('respects disabled prop', () => {
    const mockOnLoadMore = vi.fn()
    
    render(
      <LoadMoreButton
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
        disabled={true}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Load more results' })
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(mockOnLoadMore).not.toHaveBeenCalled()
  })
})
