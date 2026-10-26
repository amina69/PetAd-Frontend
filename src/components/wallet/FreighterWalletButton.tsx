import { LogOut, Wallet } from "lucide-react";
import {
  shortenWalletAddress,
  useFreighterWallet,
} from "../../hooks/useFreighterWallet";

export function FreighterWalletButton() {
  const {
    address,
    connect,
    disconnect,
    error,
    isConnecting,
    isConnected,
  } = useFreighterWallet();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2" data-testid="freighter-wallet-connected">
        <span
          className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline"
          title={address}
        >
          {shortenWalletAddress(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          aria-label="Disconnect Freighter wallet"
          className="rounded-full bg-gray-50 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void connect()}
        disabled={isConnecting}
        aria-label="Connect Freighter wallet"
        className="flex items-center gap-2 rounded-full bg-[#001323] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#173047] disabled:cursor-wait disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        data-testid="freighter-connect-button"
      >
        <Wallet size={17} />
        <span>{isConnecting ? "Connecting..." : "Connect wallet"}</span>
      </button>
      {error ? (
        <p className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-red-100 bg-white p-3 text-xs text-red-600 shadow-lg dark:border-red-900 dark:bg-gray-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
