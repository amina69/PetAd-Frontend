import { useCallback, useEffect, useState } from "react";
import {
  getAddress,
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";

const SESSION_KEY = "petad:freighter-address";

type FreighterError = {
  message?: string;
};

function errorMessage(error: FreighterError | undefined, fallback: string): string {
  return error?.message?.trim() || fallback;
}

export function shortenWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

export function useFreighterWallet() {
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreWallet() {
      try {
        const connection = await isConnected();
        if (!connection.isConnected) {
          sessionStorage.removeItem(SESSION_KEY);
          return;
        }

        const wallet = await getAddress();
        if (!cancelled && wallet.address) {
          setAddress(wallet.address);
          sessionStorage.setItem(SESSION_KEY, wallet.address);
        }
      } catch {
        // A missing extension should not prevent the rest of the app loading.
      }
    }

    const storedAddress = sessionStorage.getItem(SESSION_KEY);
    if (storedAddress) setAddress(storedAddress);
    void restoreWallet();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError("");

    try {
      const wallet = await requestAccess();
      if (wallet.error || !wallet.address) {
        throw new Error(
          errorMessage(
            wallet.error,
            "Freighter could not connect. Please approve the request and try again.",
          ),
        );
      }

      setAddress(wallet.address);
      sessionStorage.setItem(SESSION_KEY, wallet.address);
    } catch (caughtError) {
      setError(
        errorMessage(
          caughtError as FreighterError,
          "Freighter is unavailable. Install the extension or check that it is unlocked.",
        ),
      );
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    setError("");
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return {
    address,
    connect,
    disconnect,
    error,
    isConnecting,
    isConnected: Boolean(address),
  };
}
