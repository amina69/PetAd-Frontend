interface DocumentExpiryBadgeProps {
  expiresAt: string | null;
}

export function DocumentExpiryBadge({ expiresAt }: DocumentExpiryBadgeProps) {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = new Date(expiresAt);
  const msUntilExpiry = expiry.getTime() - now.getTime();
  const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);

  const config =
    daysUntilExpiry < 0
      ? { label: 'Expired', textClass: 'text-red-700', bgClass: 'bg-red-100' }
      : daysUntilExpiry <= 30
        ? { label: 'Expiring soon', textClass: 'text-amber-700', bgClass: 'bg-amber-100' }
        : {
            label: `Expires ${expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            textClass: 'text-blue-700',
            bgClass: 'bg-blue-100',
          };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${config.textClass} ${config.bgClass}`}
    >
      {config.label}
    </span>
  );
}
