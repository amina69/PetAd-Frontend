import { useState, useCallback } from 'react';

export interface UseMockPaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

/**
 * A mock hook to simulate cursor-based pagination with network delay.
 * Useful for development and testing before real backend integration.
 * 
 * @param generateItems - Function to generate mock items for a given page/cursor
 * @param initialTotalPages - How many pages to simulate before hasNextPage becomes false
 * @param delayMs - Simulated network delay in milliseconds
 */
export function useMockPagination<T>(
  generateItems: (pageIndex: number) => T[],
  initialTotalPages: number = 3,
  delayMs: number = 1000
): UseMockPaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [items, setItems] = useState<T[]>(() => generateItems(1));

  const hasNextPage = currentPage < initialTotalPages;

  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    setIsFetchingNextPage(true);

    // Simulate network delay
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newItems = generateItems(nextPage);
      
      setItems((prevItems) => [...prevItems, ...newItems]);
      setCurrentPage(nextPage);
      setIsFetchingNextPage(false);
    }, delayMs);
  }, [hasNextPage, isFetchingNextPage, currentPage, generateItems, delayMs]);

  return {
    items,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
}
