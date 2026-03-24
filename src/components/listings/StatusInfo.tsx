export default function StatusInfo({ status }: { status: string }) {
  if (status === "Pending Consent") {
    return (
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <svg
          className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-700">
            Pending Consent
          </p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            Go to the Interested Users tab to approve / consent to an adoption
            interest.
          </p>
        </div>
      </div>
    );
  }

  if (status === "Consent Granted") {
    return (
      <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <svg
          className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-700">
            Consent Granted
          </p>
          <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
            You have approved a request to adopt your pet.
          </p>
        </div>
      </div>
    );
  }

  if (status === "Adoption In-progress") {
    return (
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <svg
          className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Adoption In-Progress
          </p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            The adoption process is currently underway.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
