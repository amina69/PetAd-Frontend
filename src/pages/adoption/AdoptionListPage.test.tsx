import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdoptionListPage } from './AdoptionListPage';
import * as useAdoptionListModule from '../../hooks/useAdoptionList';

// Mock the hook so we can control its return values without waiting for timeouts
vi.mock('../../hooks/useAdoptionList', async () => {
  const actual = await vi.importActual('../../hooks/useAdoptionList');
  return {
    ...actual,
    useAdoptionList: vi.fn(),
  };
});

const mockUseAdoptionList = vi.mocked(useAdoptionListModule.useAdoptionList);

const mockCounts = {
  PENDING: 5,
  APPROVED: 2,
  REJECTED: 1,
  DISPUTED: 3,
};

const mockData: useAdoptionListModule.Adoption[] = [
  { id: '1', petName: 'Bella', applicantName: 'John', status: 'PENDING', date: '2023-10-01' },
  { id: '2', petName: 'Max', applicantName: 'Jane', status: 'DISPUTED', date: '2023-10-02' },
];

describe('AdoptionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAdoptionList.mockReturnValue({
      data: mockData,
      isLoading: false,
      counts: mockCounts,
    });
  });

  const renderWithRouter = (initialRoute = '/adoptions') => {
    const renderResult = render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/adoptions" element={<AdoptionListPage />} />
          <Route path="*" element={<AdoptionListPage />} />
        </Routes>
        <RoutePathLogger />
      </MemoryRouter>
    );
    return renderResult;
  };

  // Helper component to extract the current URL path and search params
  const RoutePathLogger = () => {
    return null; // Not strictly needed, we can test URL changes via checking if the URL changes by seeing the hook args
  };

  it('renders filter chips with correct counts', () => {
    renderWithRouter();
    
    expect(screen.getByRole('checkbox', { name: /Pending/i })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // PENDING count
    
    expect(screen.getByRole('checkbox', { name: /Disputed/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // DISPUTED count
  });

  it('renders the adoption list data correctly', () => {
    renderWithRouter();
    
    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText('Applicant: John')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('updates URL query params and calls hook when a filter chip is clicked', async () => {
    renderWithRouter('/adoptions');
    
    // Initially called with empty status
    expect(mockUseAdoptionList).toHaveBeenCalledWith({ status: [] });

    // Click on Disputed
    const disputedChip = screen.getByRole('checkbox', { name: /Disputed/i });
    fireEvent.click(disputedChip);

    // It should re-render and call the hook with the updated status
    await waitFor(() => {
      expect(mockUseAdoptionList).toHaveBeenCalledWith({ status: ['DISPUTED'] });
    });
    
    // Click on Pending
    const pendingChip = screen.getByRole('checkbox', { name: /Pending/i });
    fireEvent.click(pendingChip);

    await waitFor(() => {
      expect(mockUseAdoptionList).toHaveBeenCalledWith({ status: ['DISPUTED', 'PENDING'] });
    });
  });

  it('displays empty state message reflecting selected filters', () => {
    mockUseAdoptionList.mockReturnValue({
      data: [],
      isLoading: false,
      counts: mockCounts,
    });

    renderWithRouter('/adoptions?status=DISPUTED&status=REJECTED');

    const emptyStateMsg = screen.getByTestId('empty-state-message');
    expect(emptyStateMsg).toHaveTextContent('No disputed or rejected adoptions');
  });

  it('displays default empty state when no filters are selected', () => {
    mockUseAdoptionList.mockReturnValue({
      data: [],
      isLoading: false,
      counts: mockCounts,
    });

    renderWithRouter('/adoptions');

    const emptyStateMsg = screen.getByTestId('empty-state-message');
    expect(emptyStateMsg).toHaveTextContent('No adoptions found');
  });

  it('shows loading spinner when data is loading', () => {
    mockUseAdoptionList.mockReturnValue({
      data: [],
      isLoading: true,
      counts: mockCounts,
    });

    renderWithRouter('/adoptions');
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
