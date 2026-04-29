import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Load more" button when hasNextPage is true', () => {
    render(
      <Pagination
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    
    const button = screen.getByRole('button', { name: /load more results/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Load more');
  });

  it('does not render anything when hasNextPage is false', () => {
    const { container } = render(
      <Pagination
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    
    expect(container).toBeEmptyDOMElement();
  });

  it('shows spinner and "Loading..." text when isFetchingNextPage is true', () => {
    render(
      <Pagination
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={mockOnLoadMore}
      />
    );
    
    const button = screen.getByRole('button', { name: /load more results/i });
    const spinner = screen.getByTestId('pagination-spinner');
    
    expect(button).toHaveTextContent('Loading...');
    expect(spinner).toBeInTheDocument();
  });

  it('disables the button when isFetchingNextPage is true', () => {
    render(
      <Pagination
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={mockOnLoadMore}
      />
    );
    
    const button = screen.getByRole('button', { name: /load more results/i });
    expect(button).toBeDisabled();
  });

  it('triggers onLoadMore when the button is clicked', () => {
    render(
      <Pagination
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    
    const button = screen.getByRole('button', { name: /load more results/i });
    fireEvent.click(button);
    
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });
});
