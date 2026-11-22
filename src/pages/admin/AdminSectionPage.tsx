import { useLocation } from "react-router-dom";

const sectionNames: Record<string, string> = {
  applications: "Applications", documents: "Documents", users: "Users", audit: "Audit log",
};

export default function AdminSectionPage() {
  const { pathname } = useLocation();
  const section = pathname.split("/").filter(Boolean).at(-1) ?? "admin";
  const title = sectionNames[section] ?? "Administration";
  return <section><h1 className="text-3xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-slate-600">This queue is not available yet.</p></section>;
}
