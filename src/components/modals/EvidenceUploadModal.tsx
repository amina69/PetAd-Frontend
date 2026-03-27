import { useEffect, useRef, useState } from "react";

interface EvidenceUploadModalProps {
	isOpen: boolean;
	onClose: () => void;
	disputeId: string;
}

export function EvidenceUploadModal({
	isOpen,
	onClose,
	disputeId,
}: EvidenceUploadModalProps) {
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const [notes, setNotes] = useState("");
	const [fileName, setFileName] = useState("");

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		closeButtonRef.current?.focus();

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	function handleClose() {
		setNotes("");
		setFileName("");
		onClose();
	}

	function handleSubmit() {
		handleClose();
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={handleClose}
		>
			<div
				className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="evidence-upload-title"
			>
				<button
					ref={closeButtonRef}
					type="button"
					onClick={handleClose}
					className="absolute right-5 top-5 rounded-lg p-1 transition-colors hover:bg-gray-100"
					aria-label="Close modal"
				>
					✕
				</button>

				<div className="space-y-6">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
							Evidence Upload
						</p>
						<h2 id="evidence-upload-title" className="mt-2 text-2xl font-semibold text-slate-900">
							Add supporting evidence
						</h2>
						<p className="mt-2 text-sm text-slate-500">Dispute #{disputeId}</p>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="evidence-file">
							File
						</label>
						<input
							id="evidence-file"
							type="file"
							onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
							className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
						/>
						{fileName ? <p className="mt-2 text-xs text-slate-500">Selected: {fileName}</p> : null}
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="evidence-notes">
							Notes
						</label>
						<textarea
							id="evidence-notes"
							rows={4}
							value={notes}
							onChange={(event) => setNotes(event.target.value)}
							placeholder="Describe what this file shows and why it matters."
							className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-300"
						/>
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
						>
							Upload evidence
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}