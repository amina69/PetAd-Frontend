import React from 'react';
import type { EvidenceFile } from '../../pages/disputes/types';
import { EvidenceItem } from './EvidenceItem';

interface Props {
  evidence: EvidenceFile[];
}

export function EvidenceList({ evidence }: Props) {
  if (evidence.length === 0) {
    return <p className="text-sm text-gray-500">No evidence provided.</p>;
  }

  return (
    <ul className="list-none p-0 m-0">
      {evidence.map((item) => (
        <EvidenceItem key={item.id} evidence={item} />
      ))}
    </ul>
  );
}
