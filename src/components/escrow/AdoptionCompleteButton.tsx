import { useState } from "react";

interface AdoptionCompleteButtonProps {
  isAdmin: boolean;
  onConfirm: () => void | Promise<void>;
}

export function AdoptionCompleteButton({
  isAdmin,
  onConfirm,
}: AdoptionCompleteButtonProps) {
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        Complete Adoption
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Confirm settlement
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              This marks the adoption as complete and moves the escrow to its
              final settlement step.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  void onConfirm();
                  setOpen(false);
                }}
                type="button"
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
