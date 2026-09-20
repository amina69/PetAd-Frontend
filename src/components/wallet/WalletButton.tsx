import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { useWallet } from "../../context/WalletContext";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app";

export function WalletButton() {
  const {
    address,
    isLoading,
    error,
    isFreighterInstalled,
    connect,
    disconnect,
    shortenAddress,
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  // Show error popup for 6 seconds then auto-dismiss.
  useEffect(() => {
    if (error) {
      setErrorVisible(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorVisible(false), 6000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error]);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Connected state ──────────────────────────────────────────────────────────
  if (address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-label="Wallet menu"
          className="flex items-center gap-2 px-3 py-2 bg-[#001323] text-white text-sm font-medium rounded-full hover:bg-[#002a4d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001323] focus-visible:ring-offset-2"
        >
          <Wallet size={15} />
          <span className="font-mono">{shortenAddress(address)}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden"
          >
            {/* Address block */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                Connected wallet
              </p>
              <p className="text-[12px] text-[#001323] font-mono break-all leading-relaxed">
                {address}
              </p>
            </div>

            {/* Actions */}
            <button
              onClick={copyAddress}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy size={14} className="text-gray-400" />
              {copied ? "Copied!" : "Copy address"}
            </button>

            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={14} className="text-gray-400" />
              View on explorer
            </a>

            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={14} />
                Disconnect wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Disconnected state ───────────────────────────────────────────────────────
  return (
    <div className="relative">
      <button
        onClick={connect}
        disabled={isLoading}
        aria-label={isLoading ? "Connecting wallet…" : "Connect Freighter wallet"}
        className="flex items-center gap-2 px-4 py-2 bg-[#001323] text-white text-sm font-medium rounded-full hover:bg-[#002a4d] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001323] focus-visible:ring-offset-2"
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Wallet size={15} />
        )}
        {isLoading ? "Connecting…" : "Connect Wallet"}
      </button>

      {/* Error popup */}
      {errorVisible && error && (
        <div
          role="alert"
          className="absolute right-0 mt-2 w-72 bg-white border border-red-100 rounded-2xl shadow-lg z-50 p-3.5"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-red-700">
                {isFreighterInstalled === false
                  ? "Freighter not installed"
                  : "Connection failed"}
              </p>
              <p className="text-[11px] text-red-600 mt-0.5 leading-snug">{error}</p>
              {isFreighterInstalled === false && (
                <a
                  href={FREIGHTER_INSTALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#001323] underline mt-2"
                >
                  Install Freighter
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <button
              onClick={() => setErrorVisible(false)}
              aria-label="Dismiss error"
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
