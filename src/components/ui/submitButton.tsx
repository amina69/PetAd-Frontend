// ─── Reusable: SubmitButton ───────────────────────────────────────────────────

interface SubmitButtonProps {
  label: string;
  isLoading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
}

export function SubmitButton({ label, isLoading, loadingLabel, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="w-full rounded-xl bg-[#E84D2A] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#d4431f] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E84D2A]/40 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}