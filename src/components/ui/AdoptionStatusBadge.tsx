import type { AdoptionStatus } from '../../types/adoption'

interface AdoptionStatusBadgeProps {
  status: AdoptionStatus | string
}

const STATUS_CONFIG: Record<string, {
  label: string
  textClass: string
  bgClass: string
  tooltip: string
}> = {
  ESCROW_CREATED: {
    label: 'Escrow Created',
    textClass: 'text-gray-700',
    bgClass: 'bg-gray-100',
    tooltip: 'Escrow has been created but not funded yet.',
  },
  ESCROW_FUNDED: {
    label: 'Escrow Funded',
    textClass: 'text-teal-700',
    bgClass: 'bg-teal-100',
    tooltip: 'Funds have been deposited into escrow.',
  },
  SETTLEMENT_TRIGGERED: {
    label: 'Settlement Triggered',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-100',
    tooltip: 'Settlement process has started.',
  },
  CUSTODY_ACTIVE: {
    label: 'Custody Active',
    textClass: 'text-green-700',
    bgClass: 'bg-green-100',
    tooltip: 'Pet custody is currently active.',
  },
  FUNDS_RELEASED: {
    label: 'Funds Released',
    textClass: 'text-green-700',
    bgClass: 'bg-green-100',
    tooltip: 'Funds have been released successfully.',
  },
  COMPLETED: {
    label: 'Completed',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-100',
    tooltip: 'The adoption lifecycle has been completed.',
  },
  CANCELLED: {
    label: 'Cancelled',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    tooltip: 'The adoption was cancelled before completion.',
  },
  DISPUTED: {
    label: 'Disputed',
    textClass: 'text-red-700',
    bgClass: 'bg-red-100',
    tooltip: 'There is a dispute in the adoption.',
  },
  NOT_FOUND: {
    label: 'Not Found',
    textClass: 'text-gray-700',
    bgClass: 'bg-gray-100',
    tooltip: 'Unknown adoption status.',
  },
}

export function AdoptionStatusBadge({ status }: AdoptionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_FOUND

  return (
    <div className="relative group inline-block">
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.textClass} ${config.bgClass}`}
      >
        {config.label}
      </span>

      <div className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block">
        <div className="rounded-md bg-black text-white text-xs px-2 py-1">
          {config.tooltip}
        </div>
      </div>
    </div>
  )
}
