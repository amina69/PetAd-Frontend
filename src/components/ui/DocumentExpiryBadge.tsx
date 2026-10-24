import { StatusBadge } from './StatusBadge';

interface DocumentExpiryBadgeProps {
  expiresAt: string | null;
  status?: string;
}

export function DocumentExpiryBadge({ expiresAt }: DocumentExpiryBadgeProps) {
  if (!expiresAt) return null;

  const now = new Date();
  const expiry = new Date(expiresAt);
  const msUntilExpiry = expiry.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

  const expiryDateStr = expiry.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (daysUntilExpiry < 0) {
    return (
      <StatusBadge
        color="red"
        label="Expired — re-upload required"
        tooltip={`Expired on ${expiryDateStr}`}
      />
    );
  }

  if (daysUntilExpiry <= 7) {
    const dayLabel = daysUntilExpiry === 1 ? 'day' : 'days';
    return (
      <StatusBadge
        color="amber"
        label={`Expiring in ${daysUntilExpiry} ${dayLabel}`}
        tooltip={`Expires on ${expiryDateStr}`}
      />
    );
  }

  return null;
}
