import { ExternalLink } from "lucide-react";
import { truncateTxHash } from "../../lib/stellar";

interface StellarTxLinkProps {
  id: string;
  type: 'account' | 'tx';
  label?: string;
  className?: string;
}

export function StellarTxLink({ id, type, label, className = "" }: StellarTxLinkProps) {
  if (!id) return null;
  const displayLabel = label ?? truncateTxHash(id).replace('...', '…');
  const href = `https://stellar.expert/explorer/public/${type}/${id}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View transaction on Stellar explorer"
      className={`inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline ${className}`}
      data-testid="stellar-tx-link"
    >
      {displayLabel}
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}