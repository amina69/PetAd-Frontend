import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompleteAdoptionButton } from "../CompleteAdoptionButton";

const mockMutate = vi.fn();
const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

// paths must match what the component actually imports
vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock("../../../hooks/useMutateCompleteAdoption", () => ({
  useMutateCompleteAdoption: vi.fn(),
}));

import { useRoleGuard } from "../../../hooks/useRoleGuard";
import { useMutateCompleteAdoption } from "../../../hooks/useMutateCompleteAdoption";

beforeEach(() => {
  vi.clearAllMocks();

  // must include all fields useRoleGuard returns: role, isAdmin, isUser
  vi.mocked(useRoleGuard).mockReturnValue({
    role: "admin",
    isAdmin: true,
    isUser: false,
    hasAccess: vi.fn().mockReturnValue(true),
  });

  vi.mocked(useMutateCompleteAdoption).mockReturnValue({
    mutateCompleteAdoption: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  });
});

const defaultProps = {
  adoptionId: "123",
  adoptionStatus: "CUSTODY_ACTIVE" as const,
  onSuccess: mockOnSuccess,
  onError: mockOnError,
};

describe("CompleteAdoptionButton", () => {
  it("is hidden for non-admins", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "user",
      isAdmin: false,
      isUser: true,
      hasAccess: vi.fn().mockReturnValue(false),
    });
    const { container } = render(<CompleteAdoptionButton {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("is hidden when status is not CUSTODY_ACTIVE", () => {
    const { container } = render(
      <CompleteAdoptionButton
        {...defaultProps}
        adoptionStatus="ESCROW_FUNDED"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders button for admin with CUSTODY_ACTIVE status", () => {
    render(<CompleteAdoptionButton {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /complete adoption/i }),
    ).toBeTruthy();
  });

  it("opens confirmation modal on button click", () => {
    render(<CompleteAdoptionButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /complete adoption/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/release the escrow on Stellar/i)).toBeTruthy();
  });

  it("closes modal without calling mutate when Cancel is clicked", () => {
    render(<CompleteAdoptionButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /complete adoption/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls mutate and closes modal on Confirm", () => {
    mockMutate.mockResolvedValue(undefined);
    render(<CompleteAdoptionButton {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /complete adoption/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(mockMutate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows spinner and disables button while pending", () => {
    vi.mocked(useMutateCompleteAdoption).mockReturnValue({
      mutateCompleteAdoption: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    });
    render(<CompleteAdoptionButton {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /processing/i });
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});