
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdoptionTimelinePage from "../AdoptionTimelinePage";
import { useAdoptionTimeline } from "../../hooks/useAdoptionTimeline";
import type { AdoptionTimelineEntry } from "../../types/adoption";

vi.mock("../../hooks/useAdoptionTimeline", () => ({
  useAdoptionTimeline: vi.fn(),
}));

// Mock the TimelineEntry UI component to simplify testing the page's structure and logic
vi.mock("../../components/ui/TimelineEntry", () => ({
  TimelineEntry: ({ entry }: { entry: AdoptionTimelineEntry }) => (
    <div data-testid="mock-timeline-entry">{entry.actor} - {entry.toStatus}</div>
  ),
}));

const getTodayString = () => new Date().toISOString();
const getEarlierString = () => new Date(Date.now() - 86400000 * 3).toISOString();

const mockEntries: AdoptionTimelineEntry[] = [
  {
    id: "1",
    adoptionId: "123",
    timestamp: getTodayString(),
    sdkEvent: "event1",
    message: "Message 1",
    fromStatus: "ESCROW_CREATED",
    toStatus: "ESCROW_FUNDED",
    actor: "Alice",
  },
  {
    id: "2",
    adoptionId: "123",
    timestamp: getEarlierString(),
    sdkEvent: "event2",
    message: "Message 2",
    fromStatus: null,
    toStatus: "ESCROW_CREATED",
    actor: "System",
  }
];

describe("AdoptionTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/adoption/123/timeline"]}>
        <Routes>
          <Route path="/adoption/:adoptionId/timeline" element={<AdoptionTimelinePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders loading skeletons initially", () => {
    vi.mocked(useAdoptionTimeline).mockReturnValue({
      entries: [],
      isLoading: true,
      isError: false,
    });

    renderComponent();
    expect(screen.getAllByTestId("skeleton")).toHaveLength(5);
  });

  it("renders empty state when there are no entries", () => {
    vi.mocked(useAdoptionTimeline).mockReturnValue({
      entries: [],
      isLoading: false,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText("No status changes yet")).toBeInTheDocument();
  });

  it("renders entries grouped by date", () => {
    vi.mocked(useAdoptionTimeline).mockReturnValue({
      entries: mockEntries,
      isLoading: false,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Earlier")).toBeInTheDocument();
    
    // Check mocked entry content
    expect(screen.getByText("Alice - ESCROW_FUNDED")).toBeInTheDocument();
    expect(screen.getByText("System - ESCROW_CREATED")).toBeInTheDocument();
    
    // First element should have the highlight class
    const latestEntry = screen.getByTestId("timeline-entry-latest");
    expect(latestEntry).toBeInTheDocument();
    expect(latestEntry).toHaveClass("bg-orange-50/50");
  });
});
