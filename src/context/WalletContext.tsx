import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getAddress,
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";

const SESSION_KEY = "petad:wallet:address";

interface WalletState {
  address: string | null;
  isLoading: boolean;
  error: string | null;
  isFreighterInstalled: boolean | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  shortenAddress: (addr: string) => string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    isLoading: false,
    error: null,
    isFreighterInstalled: null,
  });

  // Restore wallet address from session on mount.
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;

    getAddress()
      .then((res) => {
        if (!res.error && res.address === saved) {
          setState((prev) => ({
            ...prev,
            address: res.address,
            isFreighterInstalled: true,
          }));
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
      });
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const connectionStatus = await isConnected();

      if (!connectionStatus.isConnected) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isFreighterInstalled: false,
          error:
            "Freighter wallet extension is not installed. Please install it to connect.",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isFreighterInstalled: true }));

      const access = await requestAccess();

      if (access.error) {
        const message =
          typeof access.error === "string"
            ? access.error
            : (access.error as { message?: string }).message ??
              "Connection request was rejected.";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        return;
      }

      sessionStorage.setItem(SESSION_KEY, access.address);
      setState((prev) => ({
        ...prev,
        address: access.address,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet connection failed unexpectedly.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setState((prev) => ({ ...prev, address: null, error: null }));
  }, []);

  const shortenAddress = useCallback((addr: string) => {
    if (!addr || addr.length <= 10) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, []);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, shortenAddress }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
