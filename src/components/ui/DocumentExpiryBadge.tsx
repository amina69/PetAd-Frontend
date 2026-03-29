import { AlertCircle } from 'lucide-react'

interface DocumentExpiryBadgeProps {
  expiresAt: string | null
  status: string
}

export function DocumentExpiryBadge({ expiresAt }: DocumentExpiryBadgeProps) {
  // No badge if expiresAt is null
  if (!expiresAt) {
    return null
  }

  const expiryDate = new Date(expiresAt)
  // Reset expiry time to midnight for consistent day comparison
  expiryDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Determine badge state and styling
  let badgeConfig: {
    label: string
    bgClass: string
    textClass: string
    tooltip: string
  }

  if (daysUntilExpiry < 0) {
    // Expired
    badgeConfig = {
      label: 'Expired — re-upload required',
      bgClass: 'bg-red-100',
      textClass: 'text-red-700',
      tooltip: `Expired on ${expiryDate.toLocaleDateString()}`,
    }
  } else if (daysUntilExpiry <= 7) {
    // Expiring soon (within 7 days)
    const dayLabel = daysUntilExpiry === 1 ? 'day' : 'days'
    badgeConfig = {
      label: `Expiring in ${daysUntilExpiry} ${dayLabel}`,
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700',
      tooltip: `Expires on ${expiryDate.toLocaleDateString()}`,
    }
  } else {
    // Not expiring soon - no badge
    return null
  }

  return (
    <div className="group relative inline-flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badgeConfig.bgClass} ${badgeConfig.textClass}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{badgeConfig.label}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 scale-95 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
        <div className="rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
          {badgeConfig.tooltip}
        </div>
      </div>
    </div>
  )
}
