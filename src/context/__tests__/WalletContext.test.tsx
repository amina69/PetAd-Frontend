import { act, render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletProvider, useWallet } from "../WalletContext";

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

// ── Helper: component that exposes wallet state via the DOM ──────────────────
function WalletConsumer() {
  const { address, isLoading, error, isFreighterInstalled, connect, disconnect } =
    useWallet();

  return (
    <div>
      <p data-testid="address">{address ?? "none"}</p>
      <p data-testid="loading">{isLoading ? "loading" : "idle"}</p>
      <p data-testid="error">{error ?? "no-error"}</p>
      <p data-testid="installed">
        {isFreighterInstalled === null
          ? "unknown"
          : isFreighterInstalled
            ? "yes"
            : "no"}
      </p>
      <button onClick={connect}>connect</button>
      <button onClick={disconnect}>disconnect</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <WalletProvider>
      <WalletConsumer />
    </WalletProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("WalletContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Default: getAddress returns empty (no session to restore).
    mockGetAddress.mockResolvedValue({ address: "" });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("starts with no address and no error", () => {
    renderWithProvider();
    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    expect(screen.getByTestId("loading")).toHaveTextContent("idle");
  });

  it("reports Freighter not installed when isConnected returns false", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });

    renderWithProvider();

    await act(async () => {
      fireEvent.click(screen.getByText("connect"));
    });

    expect(screen.getByTestId("installed")).toHaveTextContent("no");
    expect(screen.getByTestId("error").textContent).toContain("not installed");
    expect(screen.getByTestId("address")).toHaveTextContent("none");
  });

  it("surfaces error when requestAccess returns an error", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({
      address: "",
      error: { message: "User declined the request" } as never,
    });

    renderWithProvider();

    await act(async () => {
      fireEvent.click(screen.getByText("connect"));
    });

    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(screen.getByTestId("error").textContent).toBeTruthy();
  });

  it("stores address in state and sessionStorage on successful connection", async () => {
    const ADDR = "GABC1234XYZ";
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({ address: ADDR });

    renderWithProvider();

    await act(async () => {
      fireEvent.click(screen.getByText("connect"));
    });

    expect(screen.getByTestId("address")).toHaveTextContent(ADDR);
    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    expect(sessionStorage.getItem("petad:wallet:address")).toBe(ADDR);
  });

  it("clears address and sessionStorage on disconnect", async () => {
    const ADDR = "GABC1234XYZ";
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockRequestAccess.mockResolvedValue({ address: ADDR });

    renderWithProvider();

    await act(async () => {
      fireEvent.click(screen.getByText("connect"));
    });

    expect(screen.getByTestId("address")).toHaveTextContent(ADDR);

    act(() => {
      fireEvent.click(screen.getByText("disconnect"));
    });

    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(sessionStorage.getItem("petad:wallet:address")).toBeNull();
  });

  it("restores wallet address from sessionStorage on mount", async () => {
    const ADDR = "GRESTOREDADDR";
    sessionStorage.setItem("petad:wallet:address", ADDR);
    mockGetAddress.mockResolvedValue({ address: ADDR });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("address")).toHaveTextContent(ADDR);
  });

  it("clears stale sessionStorage when saved address no longer matches", async () => {
    sessionStorage.setItem("petad:wallet:address", "GSTALE");
    mockGetAddress.mockResolvedValue({ address: "GDIFFERENT" });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(sessionStorage.getItem("petad:wallet:address")).toBeNull();
  });

  it("shortenAddress truncates long addresses correctly", () => {
    let shorten: ((addr: string) => string) | undefined;

    function ShortenConsumer() {
      const { shortenAddress } = useWallet();
      shorten = shortenAddress;
      return null;
    }

    render(
      <WalletProvider>
        <ShortenConsumer />
      </WalletProvider>,
    );

    expect(shorten!("GABCDEFG1234")).toBe("GABC...1234");
    expect(shorten!("SHORT")).toBe("SHORT");
  });

  it("throws when useWallet is used outside WalletProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<WalletConsumer />)).toThrow(
      "useWallet must be used within a WalletProvider",
    );
    consoleError.mockRestore();
  });
});
