export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        We’ll be back shortly
      </h1>
      <p className="max-w-lg text-slate-700">
        PetAd is temporarily unavailable while we perform maintenance. Please
        try again in a few minutes.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
