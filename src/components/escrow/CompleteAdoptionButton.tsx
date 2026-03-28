import { useState } from "react";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import { useMutateCompleteAdoption } from "../../hooks/useMutateCompleteAdoption";
import type { AdoptionStatus } from "../../types/adoption";

interface CompleteAdoptionButtonProps {
  adoptionId: string;
  adoptionStatus: AdoptionStatus;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function CompleteAdoptionButton({
  adoptionId,
  adoptionStatus,
  onSuccess,
  onError,
}: CompleteAdoptionButtonProps) {
  const { isAdmin } = useRoleGuard();
  const { mutateCompleteAdoption, isPending } =
    useMutateCompleteAdoption(adoptionId);
  const [open, setOpen] = useState(false);

  if (!isAdmin || adoptionStatus !== "CUSTODY_ACTIVE") {
    return null;
  }

  async function handleConfirm() {
    setOpen(false);
    try {
      await mutateCompleteAdoption();
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      onError?.(message);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            />
            Processing...
          </>
        ) : (
          "Complete Adoption"
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2
              id="confirm-title"
              className="text-xl font-semibold text-slate-900"
            >
              Confirm settlement
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              This will release the escrow on Stellar. Are you sure?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}