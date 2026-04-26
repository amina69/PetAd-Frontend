import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { DisputeDetailPage } from '../DisputeDetailPage';
import { useDisputeDetail } from '../../../hooks/useDisputeDetail';
import type { DisputeDetail } from '../types';

// Mock the hook
vi.mock('../../../hooks/useDisputeDetail');

const mockUseDisputeDetail = useDisputeDetail as unknown as ReturnType<typeof vi.fn>;

const mockDisputeData: DisputeDetail = {
  id: "DSP-123",
  raisedBy: {
    name: "John Doe",
    role: "ADOPTER",
  },
  reason: "Test dispute reason",
  status: "OPEN",
  slaStatus: "ON_TIME",
  escrow: {
    status: "LOCKED",
    accountId: "GBTEST",
  },
  evidence: [
    {
      id: "ev-1",
      fileName: "test.png",
      url: "http://test.com",
      sha256: "test-hash",
    },
  ],
};

describe('DisputeDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SkeletonLoader when isLoading is true', () => {
    mockUseDisputeDetail.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <DisputeDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should render dispute data correctly after load', () => {
    mockUseDisputeDetail.mockReturnValue({
      data: mockDisputeData,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DisputeDetailPage />
      </MemoryRouter>
    );

    // Check Raised By
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ADOPTER')).toBeInTheDocument();

    // Check Reason
    expect(screen.getByText('Test dispute reason')).toBeInTheDocument();

    // Check Statuses
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('On Time')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('should render evidence list correctly', () => {
    mockUseDisputeDetail.mockReturnValue({
      data: mockDisputeData,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DisputeDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText('test.png')).toBeInTheDocument();
    expect(screen.getByText(/SHA-256:/)).toBeInTheDocument();
    expect(screen.getByText('Download')).toHaveAttribute('href', 'http://test.com');
  });

  it('should show Add Evidence button when status is OPEN', () => {
    mockUseDisputeDetail.mockReturnValue({
      data: { ...mockDisputeData, status: 'OPEN' },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DisputeDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Add Evidence/i })).toBeInTheDocument();
  });

  it('should hide Add Evidence button when status is RESOLVED', () => {
    mockUseDisputeDetail.mockReturnValue({
      data: { ...mockDisputeData, status: 'RESOLVED' },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DisputeDetailPage />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /Add Evidence/i })).not.toBeInTheDocument();
  });
});
