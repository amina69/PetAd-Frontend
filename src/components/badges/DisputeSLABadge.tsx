import type { DisputeDetail } from '../../pages/disputes/types';

interface Props {
  slaStatus: DisputeDetail['slaStatus'];
}

export function DisputeSLABadge({ slaStatus }: Props) {
  const styles: Record<DisputeDetail['slaStatus'], string> = {
    ON_TIME: "bg-green-100 text-green-800",
    AT_RISK: "bg-yellow-100 text-yellow-800",
    BREACHED: "bg-red-100 text-red-800",
  };

  const labels: Record<DisputeDetail['slaStatus'], string> = {
    ON_TIME: "On Time",
    AT_RISK: "At Risk",
    BREACHED: "Breached",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[slaStatus]}`}>
      {labels[slaStatus]}
    </span>
  );
}
