import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navigation = [
  { label: "Overview", to: "/admin", end: true },
  { label: "Applications", to: "/admin/approvals" },
  { label: "Disputes", to: "/admin/disputes" },
  { label: "Documents", to: "/admin/documents" },
  { label: "Users", to: "/admin/users" },
  { label: "Audit log", to: "/admin/audit" },
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const activeSection = navigation.find(({ to, end }) => end ? pathname === to : pathname.startsWith(`${to}/`) || pathname === to)?.label ?? "Overview";
  const links = (mobile = false) => navigation.map(({ label, to, end }) => (
    <NavLink key={to} to={to} end={end} onClick={() => mobile && setMenuOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${isActive ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      {label}
    </NavLink>
  ));

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to admin content</a>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block" aria-label="Administration navigation">
        <NavLink to="/admin" className="mb-8 block text-xl font-bold text-slate-900">PetAd Admin</NavLink>
        <nav className="space-y-1">{links()}</nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <NavLink to="/admin" className="font-bold text-slate-900">PetAd Admin</NavLink>
          <button type="button" aria-expanded={menuOpen} aria-controls="admin-mobile-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600">
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </header>
        {menuOpen && <nav id="admin-mobile-nav" aria-label="Administration navigation" className="space-y-1 border-b border-slate-200 bg-white p-3 md:hidden">{links(true)}</nav>}
        <main id="admin-content" className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><ol className="flex items-center gap-2"><li><NavLink className="hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600" to="/admin">Administration</NavLink></li>{activeSection !== "Overview" && <><li aria-hidden="true">/</li><li aria-current="page" className="font-medium text-slate-800">{activeSection}</li></>}</ol></nav>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
