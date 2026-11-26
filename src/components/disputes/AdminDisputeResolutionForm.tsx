import { useState, type FormEvent } from "react";
import { toast } from "react-hot-toast";
import { useResolveDispute } from "../../hooks/useResolveDispute";
import { disputeModerationSchema } from "../../features/disputes/schemas/moderationSchemas";
import { ConfirmDialog } from "../ui/ConfirmDialog";

type Props = {
  disputeId: string;
  totalAmount?: number;
};

export default function AdminDisputeResolutionForm({
  disputeId,
  totalAmount = 0,
}: Props) {
  const [shelterPercent, setShelterPercent] = useState(60);
  const [adopterPercent, setAdopterPercent] = useState(40);
  const [status, setStatus] = useState<"UNDER_REVIEW" | "RESOLVED">("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useResolveDispute();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = disputeModerationSchema.safeParse({
      status,
      resolutionNote,
      assignedAdminId: assignedAdminId || undefined,
    });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Check the moderation details.");
      return;
    }
    if (status === "RESOLVED") {
      if (shelterPercent < 0 || adopterPercent < 0 || shelterPercent + adopterPercent !== 100) {
        setError("The fund split must add up to 100%.");
        return;
      }
      setShowConfirmation(true);
      return;
    }
    void submitModeration(validation.data);
  };

  const submitModeration = async (input: {
    status: "UNDER_REVIEW" | "RESOLVED";
    resolutionNote: string;
    assignedAdminId?: string;
  }) => {
    setError(null);
    try {
      await mutateAsync({
        disputeId,
        shelterPercent,
        adopterPercent,
        resolutionNote: input.resolutionNote,
        assignedAdminId: input.assignedAdminId,
        status: input.status,
      });
      setShowConfirmation(false);
      toast.success(input.status === "RESOLVED" ? "Dispute resolved" : "Dispute moved to review");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to update the dispute.";
      setError(message);
      toast.error(message);
    }
  };

  const shelterAmount = (shelterPercent / 100) * totalAmount;
  const adopterAmount = (adopterPercent / 100) * totalAmount;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-orange-100 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Admin moderation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Record an official note and update the dispute status.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dispute-status" className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="dispute-status"
              value={status}
              onChange={(event) => {
                if (event.target.value === "UNDER_REVIEW" || event.target.value === "RESOLVED") {
                  setStatus(event.target.value);
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="UNDER_REVIEW">Under review</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div>
            <label htmlFor="assigned-admin" className="mb-1 block text-sm font-medium text-gray-700">
              Assign to admin (optional)
            </label>
            <input
              id="assigned-admin"
              value={assignedAdminId}
              onChange={(event) => setAssignedAdminId(event.target.value)}
              placeholder="Admin user ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="official-resolution-note" className="mb-1 block text-sm font-medium text-gray-700">
            Official resolution note <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="official-resolution-note"
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            maxLength={2000}
            rows={4}
            aria-required="true"
            aria-describedby="resolution-note-help"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p id="resolution-note-help" className="mt-1 text-xs text-gray-500">
            At least 20 characters. The note is added to the dispute timeline.
          </p>
        </div>

        {status === "RESOLVED" && (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium text-gray-700">Escrow split</legend>
            <label className="text-sm text-gray-700">
              Shelter %
              <input
                type="number"
                min={0}
                max={100}
                value={shelterPercent}
                onChange={(event) => setShelterPercent(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              {totalAmount > 0 && (
                <span className="mt-1 block text-xs text-gray-500">{shelterAmount} XLM</span>
              )}
            </label>
            <label className="text-sm text-gray-700">
              Adopter %
              <input
                type="number"
                min={0}
                max={100}
                value={adopterPercent}
                onChange={(event) => setAdopterPercent(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              {totalAmount > 0 && (
                <span className="mt-1 block text-xs text-gray-500">{adopterAmount} XLM</span>
              )}
            </label>
          </fieldset>
        )}

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : status === "RESOLVED" ? "Review resolution" : "Update status"}
        </button>
      </form>

      {showConfirmation && (
        <ConfirmDialog
          title="Confirm dispute resolution"
          description={
            <>
              <p>This action resolves the dispute and cannot be undone.</p>
              <p className="mt-3">
                Shelter: {shelterPercent}%{totalAmount > 0 ? ` (${shelterAmount} XLM)` : ""} · Adopter:{" "}
                {adopterPercent}%{totalAmount > 0 ? ` (${adopterAmount} XLM)` : ""}
              </p>
              <p className="mt-3 break-words">Note: {resolutionNote.trim()}</p>
            </>
          }
          confirmLabel="Resolve dispute"
          isPending={isPending}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => {
            const validation = disputeModerationSchema.safeParse({
              status: "RESOLVED",
              resolutionNote,
              assignedAdminId: assignedAdminId || undefined,
            });
            if (!validation.success) {
              setError(validation.error.issues[0]?.message ?? "Check the moderation details.");
              setShowConfirmation(false);
              return;
            }
            void submitModeration(validation.data);
          }}
        />
      )}
    </>
  );
}
