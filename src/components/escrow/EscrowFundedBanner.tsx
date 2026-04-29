import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatAmount, getEscrowFundedBannerStorageKey } from "./types";
import { StellarTxLink } from "../ui/StellarTxLink";

interface EscrowFundedBannerProps {
  adoptionId: string;
  petName: string;
  amount: number;
  txHash?: string;
  currency?: string;
}

export function EscrowFundedBanner({
  adoptionId,
  petName,
  amount,
  txHash,
  currency,
}: EscrowFundedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storageKey = getEscrowFundedBannerStorageKey(adoptionId);
    const isDismissedInStorage = sessionStorage.getItem(storageKey) === "true";
    setDismissed(isDismissedInStorage);
    
    if (!isDismissedInStorage) {
      setIsVisible(false); // Reset visibility for animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [adoptionId]);

  if (dismissed) {
    return null;
  }

  function dismiss() {
    const storageKey = getEscrowFundedBannerStorageKey(adoptionId);
    sessionStorage.setItem(storageKey, "true");
    setIsVisible(false);
    // Remove from DOM after animation completes
    setTimeout(() => setDismissed(true), 300);
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative mb-6 transform overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5 
        text-emerald-900 shadow-sm transition-all duration-500 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
      `}
      data-testid="escrow-funded-banner"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Payment Secured
            </p>
          </div>
          <div className="mt-2 text-base font-medium leading-relaxed">
            Escrow funds of <span className="font-bold">{formatAmount(amount, currency)}</span> for{" "}
            <span className="font-bold">{petName}</span> have been successfully secured on-chain.
            {txHash && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm">
                View transaction: <StellarTxLink id={txHash} type="tx" className="font-semibold underline decoration-emerald-300 hover:decoration-emerald-500 transition-colors" />
              </span>
            )}
          </div>
        </div>
        <button
          aria-label="Dismiss funded banner"
          className="group -mr-2 -mt-2 p-2 transition-colors hover:text-emerald-600"
          onClick={dismiss}
          type="button"
        >
          <X className="h-5 w-5 opacity-50 group-hover:opacity-100" />
        </button>
      </div>
    </div>
  );
}
