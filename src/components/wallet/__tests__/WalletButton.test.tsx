import { act, render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletButton } from "../WalletButton";
import { WalletProvider } from "../../../context/WalletContext";

// ── Mock @stellar/freighter-api ──────────────────────────────────────────────
vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
}));

import { isConnected, requestAccess, getAddress } from "@stellar/freighter-api";

const mockIsConnected = vi.mocked(isConnected);
const mockRequestAccess = vi.mocked(requestAccess);
const mockGetAddress = vi.mocked(getAddress);

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderButton() {
  return render(
    <WalletProvider>
      <WalletButton />
    </WalletProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("WalletButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockGetAddress.mockResolvedValue({ address: "" });
  });

  it("renders Connect Wallet button when not connected", () => {
    renderButton();
    expect(
      screen.getByRole("button", { name: /connect.*wallet/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state while connecting", async () => {
    // requestAccess never resolves so we stay in loading state.
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockImplementation(() => new Promise(() => {}));

    renderButton();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    expect(await screen.findByText(/connecting/i)).toBeInTheDocument();
  });

  it("displays shortened address and disables Connect button after connection", async () => {
    const ADDR = "GABCDEF1234XYZ1";
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({ address: ADDR });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    // Should now show a wallet menu button with the shortened address.
    expect(screen.getByRole("button", { name: /wallet menu/i })).toBeInTheDocument();
    expect(screen.getByText(/GABC\.\.\.XYZ1/)).toBeInTheDocument();
    // Connect button should be gone.
    expect(
      screen.queryByRole("button", { name: /connect.*wallet/i }),
    ).not.toBeInTheDocument();
  });

  it("opens dropdown and shows full address and disconnect option when connected", async () => {
    const ADDR = "GABCDEF1234XYZ1";
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({ address: ADDR });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    // Open dropdown.
    fireEvent.click(screen.getByRole("button", { name: /wallet menu/i }));

    expect(screen.getByText(ADDR)).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /disconnect/i })).toBeInTheDocument();
  });

  it("disconnects wallet when Disconnect button is clicked", async () => {
    const ADDR = "GABCDEF1234XYZ1";
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({ address: ADDR });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    // Open dropdown.
    fireEvent.click(screen.getByRole("button", { name: /wallet menu/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /disconnect/i }));
    });

    expect(
      screen.getByRole("button", { name: /connect.*wallet/i }),
    ).toBeInTheDocument();
  });

  it("shows error alert when Freighter is not installed", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/freighter not installed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /install freighter/i })).toHaveAttribute(
      "href",
      "https://www.freighter.app",
    );
  });

  it("shows error alert when user rejects the connection", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({
      address: "",
      error: { message: "User rejected" } as never,
    });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
  });

  it("dismisses error popup when X button is clicked", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss error/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows connection failed message for unexpected errors", async () => {
    mockIsConnected.mockRejectedValue(new Error("Network timeout"));

    renderButton();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect.*wallet/i }));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
  });
});
