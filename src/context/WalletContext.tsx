import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

const SESSION_STORAGE_KEY = "petad:wallet-address";

export type WalletErrorCode =
  | "NOT_INSTALLED"
  | "REQUEST_REJECTED"
  | "CONNECTION_FAILED"
  | "NETWORK_ERROR";

export interface WalletError {
  code: WalletErrorCode;
  message: string;
}

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: WalletError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

/** Shorten a Stellar public key to e.g. `GABC...XYZ1` for display. */
export function shortenAddress(address: string, lead = 4, trail = 4): string {
  if (address.length <= lead + trail) {
    return address;
  }
  return `${address.slice(0, lead)}...${address.slice(-trail)}`;
}

function isFreighterNotInstalledError(message: string): boolean {
  return /not\s*(installed|found|detected)/i.test(message);
}

function isUserRejectionError(message: string): boolean {
  return /(reject|denied|declin|cancel)/i.test(message);
}

function toWalletError(err: unknown, fallbackCode: WalletErrorCode): WalletError {
  const message = err instanceof Error ? err.message : String(err);

  if (isFreighterNotInstalledError(message)) {
    return {
      code: "NOT_INSTALLED",
      message: "Freighter extension not detected. Please install it to connect your wallet.",
    };
  }

  if (isUserRejectionError(message)) {
    return {
      code: "REQUEST_REJECTED",
      message: "Connection request was rejected. Please try again and approve the request.",
    };
  }

  if (/network|fetch|timeout/i.test(message)) {
    return {
      code: "NETWORK_ERROR",
      message: "A network error occurred while connecting to Freighter. Please try again.",
    };
  }

  return {
    code: fallbackCode,
    message: message || "Something went wrong while connecting your wallet.",
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  // Restore a previously connected address for this session, but only if
  // Freighter still reports the site as allowed (avoids showing a stale
  // "connected" UI if the user revoked access from the extension itself).
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const allowed = await freighterIsAllowed();
        if (!cancelled && allowed?.isAllowed) {
          setAddress(stored);
        } else if (!cancelled) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const connection = await freighterIsConnected();
      if (connection?.error || !connection?.isConnected) {
        setError({
          code: "NOT_INSTALLED",
          message: "Freighter extension not detected. Please install it to connect your wallet.",
        });
        return;
      }

      const access = await requestAccess();
      if (access?.error) {
        throw new Error(access.error);
      }

      const result = access?.address
        ? access
        : await getAddress();

      if (result?.error || !result?.address) {
        throw new Error(result?.error || "Unable to retrieve wallet address.");
      }

      setAddress(result.address);
      sessionStorage.setItem(SESSION_STORAGE_KEY, result.address);
    } catch (err) {
      setError(toWalletError(err, "CONNECTION_FAILED"));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      isConnecting,
      error,
      connect,
      disconnect,
      clearError,
    }),
    [address, isConnecting, error, connect, disconnect, clearError],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}