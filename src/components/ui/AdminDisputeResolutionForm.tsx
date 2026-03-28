import { useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, ChevronRight, Loader2, X } from "lucide-react";
import { useMutateResolveDispute } from "../../hooks/useMutateResolveDispute";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DisputeResolutionFormValues {
  shelterPct: number;
  adopterPct: number;
  resolution: string;
  resolvedBy: string;
}

export interface AdminDisputeResolutionFormProps {
  disputeId: string;
  adoptionId: string;
  /** Total escrow amount in XLM */
  totalXlm: number;
  /** Pre-filled admin identifier */
  adminId: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";

interface ToastState {
  kind: ToastKind;
  message: string;
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const isSuccess = toast.kind === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl",
        "animate-[slideUp_0.25s_ease-out]",
        isSuccess ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
      ].join(" ")}
    >
      {isSuccess ? (
        <CheckCircle className="h-5 w-5 shrink-0" />
      ) : (
        <AlertTriangle className="h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-semibold">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 rounded-full p-0.5 opacity-70 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Step 1: Form ─────────────────────────────────────────────────────────────

interface FormStepProps {
  values: DisputeResolutionFormValues;
  totalXlm: number;
  onChange: (v: Partial<DisputeResolutionFormValues>) => void;
  onNext: () => void;
}

function FormStep({ values, totalXlm, onChange, onNext }: FormStepProps) {
  const shelterXlm = ((values.shelterPct / 100) * totalXlm).toFixed(2);
  const adopterXlm = ((values.adopterPct / 100) * totalXlm).toFixed(2);
  const totalPct = values.shelterPct + values.adopterPct;
  const isValid =
    totalPct === 100 &&
    values.resolution.trim().length > 0 &&
    values.resolvedBy.trim().length > 0;

  function handleShelterPct(raw: string) {
    const n = Math.min(100, Math.max(0, Number(raw) || 0));
    onChange({ shelterPct: n, adopterPct: 100 - n });
  }

  return (
    <div className="space-y-6">
      {/* Split inputs */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          Escrow Split — Total {totalXlm} XLM
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Shelter */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Shelter %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={values.shelterPct}
              onChange={(e) => handleShelterPct(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none focus:ring-0"
              aria-label="Shelter percentage"
            />
            <p className="mt-1 text-sm font-medium text-indigo-600">
              {shelterXlm} XLM
            </p>
          </div>

          {/* Adopter */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Adopter %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={values.adopterPct}
              onChange={(e) => {
                const n = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                onChange({ adopterPct: n, shelterPct: 100 - n });
              }}
              className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none focus:ring-0"
              aria-label="Adopter percentage"
            />
            <p className="mt-1 text-sm font-medium text-indigo-600">
              {adopterXlm} XLM
            </p>
          </div>
        </div>

        {totalPct !== 100 && (
          <p className="mt-2 text-xs font-semibold text-red-500">
            Percentages must sum to 100% (currently {totalPct}%)
          </p>
        )}
      </div>

      {/* Resolution notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Resolution Notes
        </label>
        <textarea
          rows={3}
          value={values.resolution}
          onChange={(e) => onChange({ resolution: e.target.value })}
          placeholder="Describe the reason for this resolution…"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          aria-label="Resolution notes"
        />
      </div>

      {/* Resolved by */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Resolved By (Admin ID)
        </label>
        <input
          type="text"
          value={values.resolvedBy}
          onChange={(e) => onChange({ resolvedBy: e.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Admin ID"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Review Resolution
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Step 2: Confirmation ─────────────────────────────────────────────────────

interface ConfirmStepProps {
  values: DisputeResolutionFormValues;
  totalXlm: number;
  isPending: boolean;
  inlineError: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

function ConfirmStep({
  values,
  totalXlm,
  isPending,
  inlineError,
  onBack,
  onConfirm,
}: ConfirmStepProps) {
  const shelterXlm = ((values.shelterPct / 100) * totalXlm).toFixed(2);
  const adopterXlm = ((values.adopterPct / 100) * totalXlm).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Split summary */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
          Escrow Split Summary
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Shelter</span>
          <span className="text-sm font-bold text-slate-900">
            {values.shelterPct}% ({shelterXlm} XLM)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Adopter</span>
          <span className="text-sm font-bold text-slate-900">
            {values.adopterPct}% ({adopterXlm} XLM)
          </span>
        </div>
      </div>

      {/* Resolution notes preview */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
          Resolution Notes
        </p>
        <p className="text-sm text-slate-700">{values.resolution}</p>
      </div>

      {/* Stellar warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs font-semibold text-amber-800 leading-relaxed">
          This will release the escrow on Stellar.{" "}
          <span className="text-amber-900">This cannot be undone.</span>
        </p>
      </div>

      {/* Inline error */}
      {inlineError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs font-semibold text-red-700">{inlineError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isPending}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resolving…
            </>
          ) : (
            "Confirm & Release Escrow"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDisputeResolutionForm({
  disputeId,
  adoptionId,
  totalXlm,
  adminId,
}: AdminDisputeResolutionFormProps) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [values, setValues] = useState<DisputeResolutionFormValues>({
    shelterPct: 60,
    adopterPct: 40,
    resolution: "",
    resolvedBy: adminId,
  });

  const showToast = useCallback((kind: ToastKind, message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const { mutateResolveDispute, isPending } = useMutateResolveDispute({
    disputeId,
    adoptionId,
    onSuccess: () => {
      showToast("success", "Dispute resolved");
      setStep("form");
      setInlineError(null);
    },
    onError: (message) => {
      setInlineError(message);
    },
  });

  function handleChange(partial: Partial<DisputeResolutionFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }));
  }

  function handleConfirm() {
    setInlineError(null);
    mutateResolveDispute({
      shelterPct: values.shelterPct,
      adopterPct: values.adopterPct,
      resolution: values.resolution,
      resolvedBy: values.resolvedBy,
    });
  }

  return (
    <>
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Resolve Dispute</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
              {step === "form" ? "Step 1 of 2" : "Step 2 of 2"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Dispute <span className="font-mono">{disputeId}</span>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === "form" ? (
            <FormStep
              values={values}
              totalXlm={totalXlm}
              onChange={handleChange}
              onNext={() => setStep("confirm")}
            />
          ) : (
            <ConfirmStep
              values={values}
              totalXlm={totalXlm}
              isPending={isPending}
              inlineError={inlineError}
              onBack={() => setStep("form")}
              onConfirm={handleConfirm}
            />
          )}
        </div>
      </div>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
