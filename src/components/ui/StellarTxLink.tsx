import { Copy } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { stellarExplorerUrl, truncateTxHash } from '../../lib/stellar';

interface StellarTxLinkProps {
  txHash: string;
  className?: string;
}

export function StellarTxLink({ txHash, className = '' }: StellarTxLinkProps) {
  if (!txHash) {
    return null;
  }

  const explorerUrl = stellarExplorerUrl(txHash);
  const truncatedTxHash = truncateTxHash(txHash).replace('...', '…');

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(txHash).catch(() => undefined);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View transaction on Stellar explorer"
        title={txHash}
        className="text-sm font-medium text-[#0A66C2] hover:text-[#084f95] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 rounded"
      >
        {truncatedTxHash}
      </a>

      <CopyToClipboard text={txHash} onCopy={handleCopy}>
        <button
          type="button"
          aria-label="Copy transaction hash"
          title="Copy full transaction hash"
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#D6DCE5] text-[#415A77] hover:bg-[#EEF3F8] hover:text-[#2A3F57] focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30"
        >
          <Copy size={14} />
        </button>
      </CopyToClipboard>
    </div>
  );
}