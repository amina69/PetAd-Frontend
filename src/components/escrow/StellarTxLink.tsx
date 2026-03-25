import { useState } from "react";
import { stellarExplorerUrl, truncateTxHash } from "../../lib/stellar";

interface StellarTxLinkProps {
  txHash: string;
}

export function StellarTxLink({ txHash }: StellarTxLinkProps) {
  const [copied, setCopied] = useState(false);
  const href = stellarExplorerUrl(txHash);
  const label = truncateTxHash(txHash);

  async function handleCopy() {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="stellar-tx-link">
      <a
        className="text-sm font-semibold text-sky-700 underline underline-offset-4"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {label}
      </a>
      <button
        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
        onClick={() => void handleCopy()}
        type="button"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
