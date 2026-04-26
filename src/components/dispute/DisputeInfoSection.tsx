import React, { useState } from 'react';
import type { DisputeDetail } from '../../pages/disputes/types';
import { DisputeStatusBadge } from '../badges/DisputeStatusBadge';
import { DisputeSLABadge } from '../badges/DisputeSLABadge';
import { EscrowStatusBadge } from '../badges/EscrowStatusBadge';
import { StellarTxLink } from '../blockchain/StellarTxLink';
import { EvidenceList } from './EvidenceList';
import { AddEvidenceButton } from './AddEvidenceButton';
import { EvidenceUploadModal } from '../modals/EvidenceUploadModal';

interface Props {
  dispute: DisputeDetail;
}

export function DisputeInfoSection({ dispute }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canAddEvidence = dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW";

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Raised By</h3>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900">{dispute.raisedBy.name}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                {dispute.raisedBy.role}
              </span>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Reason</h3>
            <p className="text-sm text-gray-900">{dispute.reason}</p>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Status</h3>
            <div className="flex space-x-3">
              <DisputeStatusBadge status={dispute.status} />
              <DisputeSLABadge slaStatus={dispute.slaStatus} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Escrow Status</h3>
            <div className="flex items-center space-x-3">
              <EscrowStatusBadge status={dispute.escrow.status} />
              <StellarTxLink accountId={dispute.escrow.accountId} />
            </div>
          </section>
        </div>

        {/* Right Column - Evidence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Evidence Files</h3>
            {canAddEvidence && (
              <AddEvidenceButton onClick={() => setIsModalOpen(true)} />
            )}
          </div>
          <EvidenceList evidence={dispute.evidence} />
        </div>
      </div>

      <EvidenceUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
