import { useState } from "react";
import { StellarTxLink } from "./StellarTxLink";
import { formatAmount, getEscrowFundedBannerStorageKey } from "./types";

export { getEscrowFundedBannerStorageKey } from "./types";

export interface EscrowFundedBannerProps {
  escrowId: string;
  amount: number;
  currency?: string;
  txHash?: string;
}

export function EscrowFundedBanner({
  escrowId,
  amount,
  currency,
  txHash,
}: EscrowFundedBannerProps) {
  const storageKey = getEscrowFundedBannerStorageKey(escrowId);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(storageKey) === "true",
  );

  if (dismissed) {
    return null;
  }

  function dismiss() {
    sessionStorage.setItem(storageKey, "true");
    setDismissed(true);
  }

  return (
    <div
      className="animate-slide-down flex items-start justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm transition-all"
      role="alert"
      aria-live="polite"
      data-testid="escrow-funded-banner"
    >
      <div className="flex-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Escrow funded
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-lg font-semibold">
          <span>
            {formatAmount(amount, currency)} is secured and ready for settlement.
          </span>
          {txHash && (
            <div className="ml-1 inline-flex items-center gap-1 border-l border-emerald-200 pl-2">
              <span className="text-sm font-normal text-emerald-700">Tx:</span>
              <StellarTxLink txHash={txHash} />
            </div>
          )}
        </div>
      </div>
      <button
        aria-label="Dismiss funded banner"
        className="shrink-0 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-100"
        onClick={dismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
