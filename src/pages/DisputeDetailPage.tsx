import { useState } from "react";
import { useParams } from "react-router-dom";
import { DisputeDetailHeader } from "../components/dispute";
import { EvidenceUploadModal } from "../components/modals";
import { useDisputeDetails } from "../hooks/useDisputeDetails";

export default function DisputeDetailPage() {
	const { disputeId } = useParams<{ disputeId: string }>();
	const { data, isLoading, isError } = useDisputeDetails(disputeId ?? "");
	const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

	return (
		<main className="min-h-screen bg-slate-100 px-4 py-10">
			<div className="mx-auto max-w-5xl">
				<DisputeDetailHeader
					data={isError ? undefined : data}
					isLoading={isLoading}
					onAddEvidence={() => setIsEvidenceModalOpen(true)}
				/>
			</div>

			<EvidenceUploadModal
				disputeId={disputeId ?? ""}
				isOpen={isEvidenceModalOpen}
				onClose={() => setIsEvidenceModalOpen(false)}
			/>
		</main>
	);
}