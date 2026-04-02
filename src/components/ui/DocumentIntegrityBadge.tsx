import { StellarTxLink } from './StellarTxLink';

interface DocumentIntegrityBadgeProps {
  onChainVerified: boolean | null;
  anchorTxHash: string | null;
}

export function DocumentIntegrityBadge({
  onChainVerified,
  anchorTxHash,
}: DocumentIntegrityBadgeProps) {
  const config =
    onChainVerified === true
      ? {
          label: 'Verified on Stellar',
          textClass: 'text-green-700',
          bgClass: 'bg-green-100',
        }
      : onChainVerified === false
        ? {
            label: 'Integrity failed',
            textClass: 'text-red-700',
            bgClass: 'bg-red-100',
          }
        : {
            label: 'Unverified',
            textClass: 'text-gray-700',
            bgClass: 'bg-gray-100',
          };

  return (
    <div className="group relative inline-flex items-center gap-2">
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${config.textClass} ${config.bgClass}`}
      >
        {config.label}
      </span>

      {onChainVerified === true && anchorTxHash ? (
        <StellarTxLink id={anchorTxHash} type="tx" />
      ) : null}

      <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[240px] -translate-x-1/2 scale-95 rounded-md bg-[#0F2236] px-3 py-2 text-[12px] text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
        On-chain verification compares this document fingerprint with the hash
        anchored on Stellar.
      </div>
    </div>
  );
}