import { FileText, Gavel, Plus, UserRound } from "lucide-react";
import { EscrowStatusBadge } from "../escrow/EscrowStatusBadge";
import { StellarTxLink } from "../escrow/StellarTxLink";
import { EmptyState } from "../ui/emptyState";
import { Skeleton } from "../ui/Skeleton";
import { DisputeSLABadge } from "./DisputeSLABadge";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import type { DisputeDetails } from "../../types/dispute";

interface DisputeDetailHeaderProps {
	data?: DisputeDetails;
	isLoading?: boolean;
	onAddEvidence?: () => void;
}

function formatRole(role: DisputeDetails["raisedBy"]["role"]) {
	return role.charAt(0) + role.slice(1).toLowerCase();
}

function HeaderSectionSkeleton() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="space-y-3" data-testid="dispute-header-skeleton">
				<Skeleton width="36%" height="20px" />
				<Skeleton width="72%" height="32px" />
				<Skeleton width="52%" height="18px" />
			</div>
		</div>
	);
	}

export function DisputeDetailHeader({
	data,
	isLoading = false,
	onAddEvidence,
}: DisputeDetailHeaderProps) {
	if (isLoading) {
		return (
			<div className="space-y-6">
				<HeaderSectionSkeleton />
				<div className="grid gap-6 lg:grid-cols-2">
					<HeaderSectionSkeleton />
					<HeaderSectionSkeleton />
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<EmptyState
				title="Dispute not found"
				description="We couldn’t load the dispute details for this record."
			/>
		);
	}

	const canAddEvidence = data.status === "OPEN" || data.status === "UNDER_REVIEW";

	return (
		<div className="space-y-6" data-testid="dispute-detail-header">
			<section className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
							Dispute Detail
						</p>
						<h1 className="mt-2 text-3xl font-semibold">Case #{data.id}</h1>
						<p className="mt-2 text-sm text-slate-400">Adoption #{data.adoptionId}</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<DisputeStatusBadge status={data.status} />
						<DisputeSLABadge deadlineAt={data.slaDeadlineAt} />
					</div>
				</div>

				<div className="mt-8 grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
							<UserRound size={16} />
							Raised by
						</div>
						<p className="mt-3 text-lg font-semibold text-white">{data.raisedBy.name}</p>
						<p className="mt-1 text-sm text-slate-300">{formatRole(data.raisedBy.role)}</p>
					</div>

					<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
							<Gavel size={16} />
							Reason
						</div>
						<p className="mt-3 text-lg font-semibold capitalize text-white">
							{data.reason.replace(/_/g, " ")}
						</p>
						<p className="mt-1 text-sm text-slate-300">{data.description}</p>
					</div>
				</div>
			</section>

			<div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						<FileText size={16} />
						Evidence Files
					</div>

					<div className="mt-5 space-y-3">
						{data.evidence.length === 0 ? (
							<EmptyState
								title="No evidence uploaded"
								description="Evidence files will appear here once they’re attached to the dispute."
							/>
						) : (
							data.evidence.map((file) => (
								<div
									key={file.id}
									className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold text-slate-900">{file.fileName}</p>
										<p className="mt-1 text-xs text-slate-500">
											Added by {file.submittedBy.name} · {new Date(file.submittedAt).toLocaleString()}
										</p>
										<span className="mt-2 inline-flex max-w-full rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
											SHA-256: {file.sha256}
										</span>
									</div>

									<a
										href={file.downloadUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
									>
										Download
									</a>
								</div>
							))
						)}
					</div>

					{canAddEvidence && onAddEvidence ? (
						<button
							type="button"
							onClick={onAddEvidence}
							className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							<Plus size={16} />
							Add evidence
						</button>
					) : null}
				</section>

				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						Escrow
					</p>
					<div className="mt-5 space-y-4">
						<div className="rounded-2xl bg-slate-50 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
								On-chain status
							</p>
							<div className="mt-3">
								<EscrowStatusBadge status={data.escrow.onChainStatus} />
							</div>
						</div>

						<div className="rounded-2xl bg-slate-50 p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
								Stellar account
							</p>
							<div className="mt-3">
								<StellarTxLink txHash={data.escrow.accountId} resourceType="account" />
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}