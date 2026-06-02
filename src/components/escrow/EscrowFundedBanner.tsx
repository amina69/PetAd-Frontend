import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StellarTxLink } from "../ui/StellarTxLink";
import { formatAmount, getEscrowFundedBannerStorageKey } from "./types";

interface EscrowFundedBannerProps {
  /** Unique adoption identifier — used as the sessionStorage dismissal key. */
  adoptionId?: string;
  /** Displayed name of the pet involved in the adoption. */
  petName?: string;
  /** Funded escrow amount. */
  amount: number;
  /** Optional currency label (defaults to "USDC"). */
  currency?: string;
  /** Stellar transaction hash for the funding transaction. */
  txHash?: string;
  /**
   * Legacy escrowId — still accepted for backward-compat with callers
   * (e.g. SettlementSummaryPage and EscrowComponents.test.tsx) that only
   * pass escrowId/amount/currency.  When adoptionId is omitted, the
   * escrowId value is used as the sessionStorage key.
   */
  escrowId?: string;
}

export function EscrowFundedBanner({
  adoptionId,
  petName = "",
  amount,
  currency,
  txHash,
  escrowId,
}: EscrowFundedBannerProps) {
  // Prefer the dedicated adoptionId key; fall back to the legacy escrowId key.
  const adoptionKey = adoptionId
    ? `escrow-banner-dismissed-${adoptionId}`
    : null;
  const legacyKey = escrowId ? getEscrowFundedBannerStorageKey(escrowId) : null;
  // At least one key must exist for dismissal to work.
  const primaryKey = adoptionKey ?? legacyKey ?? "";

  const [dismissed, setDismissed] = useState(() => {
    if (adoptionKey && sessionStorage.getItem(adoptionKey) === "true") return true;
    if (legacyKey && sessionStorage.getItem(legacyKey) === "true") return true;
    return false;
  });

  if (dismissed) return null;

  function dismiss() {
    if (primaryKey) sessionStorage.setItem(primaryKey, "true");
    // Keep the legacy key in sync so existing tests continue to pass.
    if (legacyKey && legacyKey !== primaryKey) {
      sessionStorage.setItem(legacyKey, "true");
    }
    setDismissed(true);
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="escrow-funded-banner"
      className="animate-banner-slide-in flex items-start justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-emerald-500"
          size={18}
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Escrow funded
          </p>
          <p className="mt-1 text-base font-semibold">
            Escrow of {formatAmount(amount, currency)} funded
            {petName ? ` for ${petName}’s adoption` : ""}.{txHash && (
              <>{" "}<StellarTxLink id={txHash} type="tx" className="text-emerald-700 hover:text-emerald-900" /></>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label="Dismiss funded banner"
        onClick={dismiss}
        className="shrink-0 rounded-full border border-emerald-300 px-3 py-1 text-sm font-semibold hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Dismiss
      </button>
    </div>
  );
}
