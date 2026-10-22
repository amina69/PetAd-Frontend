import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm" aria-labelledby="forbidden-title">
        <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">403 · Forbidden</p>
        <h1 id="forbidden-title" className="mt-3 text-3xl font-bold text-slate-900">Administrator access required</h1>
        <p className="mt-3 text-slate-600">Your account does not have permission to view the administration console.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2" to="/home">Return home</Link>
      </section>
    </main>
  );
}
