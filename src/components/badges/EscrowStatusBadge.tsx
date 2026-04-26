import type { DisputeDetail } from '../../pages/disputes/types';

interface Props {
  status: DisputeDetail['escrow']['status'];
}

export function EscrowStatusBadge({ status }: Props) {
  const styles: Record<DisputeDetail['escrow']['status'], string> = {
    LOCKED: "bg-yellow-100 text-yellow-800",
    RELEASED: "bg-green-100 text-green-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  const labels: Record<DisputeDetail['escrow']['status'], string> = {
    LOCKED: "Locked",
    RELEASED: "Released",
    REFUNDED: "Refunded",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
