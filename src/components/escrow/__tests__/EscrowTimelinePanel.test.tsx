import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EscrowTimelinePanel } from "../EscrowTimelinePanel";
import { useEscrowTimeline } from "../../../lib/hooks/useEscrowTimeline";

vi.mock("../../../lib/hooks/useEscrowTimeline", () => ({
  useEscrowTimeline: vi.fn(),
}));

const mockedUseEscrowTimeline = vi.mocked(useEscrowTimeline);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-25T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EscrowTimelinePanel", () => {
  it("renders a 3-row skeleton while loading", () => {
    mockedUseEscrowTimeline.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<EscrowTimelinePanel adoptionId="adoption-001" />);

    expect(screen.getByTestId("escrow-timeline-skeleton")).toBeTruthy();
    expect(screen.getAllByTestId("skeleton").length).toBe(3);
  });

  it("renders empty state when there are no events", () => {
    mockedUseEscrowTimeline.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<EscrowTimelinePanel adoptionId="adoption-001" />);

    expect(screen.getByTestId("escrow-timeline-empty")).toBeTruthy();
    expect(screen.getByText("No escrow events yet")).toBeTruthy();
  });

  it("matches snapshot for funded state", () => {
    mockedUseEscrowTimeline.mockReturnValue({
      data: [
        {
          type: "CREATED",
          label: "Escrow created",
          timestamp: "2026-03-25T06:00:00.000Z",
        },
        {
          type: "FUNDED",
          label: "Escrow funded",
          timestamp: "2026-03-25T10:00:00.000Z",
          stellarExplorerUrl:
            "https://stellar.expert/explorer/testnet/tx/abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        },
      ],
      isLoading: false,
      isError: false,
    });

    const { asFragment } = render(
      <EscrowTimelinePanel adoptionId="adoption-001" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for disputed state", () => {
    mockedUseEscrowTimeline.mockReturnValue({
      data: [
        {
          type: "CREATED",
          label: "Escrow created",
          timestamp: "2026-03-25T06:00:00.000Z",
        },
        {
          type: "FUNDED",
          label: "Escrow funded",
          timestamp: "2026-03-25T08:00:00.000Z",
          stellarExplorerUrl:
            "https://stellar.expert/explorer/testnet/tx/abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        },
        {
          type: "DISPUTED",
          label: "Dispute raised",
          timestamp: "2026-03-25T10:00:00.000Z",
        },
      ],
      isLoading: false,
      isError: false,
    });

    const { asFragment } = render(
      <EscrowTimelinePanel adoptionId="adoption-001" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for settled state", () => {
    mockedUseEscrowTimeline.mockReturnValue({
      data: [
        {
          type: "CREATED",
          label: "Escrow created",
          timestamp: "2026-03-25T06:00:00.000Z",
        },
        {
          type: "FUNDED",
          label: "Escrow funded",
          timestamp: "2026-03-25T08:00:00.000Z",
        },
        {
          type: "DISPUTED",
          label: "Dispute resolved",
          timestamp: "2026-03-25T10:00:00.000Z",
        },
        {
          type: "SETTLED",
          label: "Escrow settled",
          timestamp: "2026-03-25T11:30:00.000Z",
          stellarExplorerUrl:
            "https://stellar.expert/explorer/testnet/tx/abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        },
      ],
      isLoading: false,
      isError: false,
    });

    const { asFragment } = render(
      <EscrowTimelinePanel adoptionId="adoption-001" />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

