import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RaiseDisputeTrigger } from "../RaiseDisputeTrigger";
import * as disputeHookModule from "../../../hooks/useMutateRaiseDispute";

vi.mock("../../../hooks/useMutateRaiseDispute", () => ({
  useMutateRaiseDispute: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockHook = () => {
  vi.mocked(disputeHookModule.useMutateRaiseDispute).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    error: null,
  } as any);
};

const renderTrigger = (props?: any) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <RaiseDisputeTrigger
        adoptionId="a-1"
        adoptionStatus="CUSTODY_ACTIVE"
        raisedBy="u-1"
        isAdopter={true}
        isShelter={false}
        {...props}
      />
    </QueryClientProvider>,
  );
};

describe("RaiseDisputeTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
  });

  it("renders the trigger button when status is CUSTODY_ACTIVE and isAdopter", () => {
    renderTrigger();
    expect(screen.getByRole("button", { name: /raise a dispute/i })).toBeInTheDocument();
  });

  it("renders the trigger button when status is CUSTODY_ACTIVE and isShelter", () => {
    renderTrigger({ isAdopter: false, isShelter: true });
    expect(screen.getByRole("button", { name: /raise a dispute/i })).toBeInTheDocument();
  });

  it("does not render when status is not CUSTODY_ACTIVE", () => {
    renderTrigger({ adoptionStatus: "PENDING" });
    expect(screen.queryByRole("button", { name: /raise a dispute/i })).not.toBeInTheDocument();
  });

  it("does not render when neither isAdopter nor isShelter", () => {
    renderTrigger({ isAdopter: false, isShelter: false });
    expect(screen.queryByRole("button", { name: /raise a dispute/i })).not.toBeInTheDocument();
  });

  it("opens the modal when trigger button is clicked", () => {
    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: /raise a dispute/i }));
    expect(screen.getByText("Tell us why you're raising this dispute.")).toBeInTheDocument();
  });

  it("closes the modal when Escape is pressed", () => {
    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: /raise a dispute/i }));
    expect(screen.getByText("Tell us why you're raising this dispute.")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Tell us why you're raising this dispute.")).not.toBeInTheDocument();
  });
});