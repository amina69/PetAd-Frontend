import { useState } from "react";
import { formatAmount } from "./types";
import { getEscrowFundedBannerStorageKey } from "./utils"; // relative import

interface EscrowFundedBannerProps {
  escrowId: string;
  amount: number;
  currency?: string;
}

export function EscrowFundedBanner({
  escrowId,
  amount,
  currency,
}: EscrowFundedBannerProps) {
  const storageKey = getEscrowFundedBannerStorageKey(escrowId);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(storageKey) === "true",
  );

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(storageKey, "true");
    setDismissed(true);
  }

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
      data-testid="escrow-funded-banner"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Escrow funded
        </p>
        <p className="mt-2 text-lg font-semibold">
          {formatAmount(amount, currency)} is secured and ready for settlement.
        </p>
      </div>
      <button
        aria-label="Dismiss funded banner"
        className="rounded-full border border-emerald-300 px-3 py-1 text-sm font-semibold"
        onClick={dismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}