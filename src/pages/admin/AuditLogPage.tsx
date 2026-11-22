import { Fragment, useState } from "react";
import { AdminOnly } from "../../components/auth/AdminOnly";
import { DateRangePicker, type DateRange } from "../../components/ui/DateRangePicker";
import { useAuditLog } from "../../hooks/useAuditLog";
import { downloadCsv, toCsv } from "../../utils/csv";

function AuditLogViewer() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [range, setRange] = useState<DateRange>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const { entries, isLoading, isError, refetch } = useAuditLog({
    actor: actor.trim() || undefined,
    action: action || undefined,
    from: range.from,
    to: range.to,
  });

  const actions = Array.from(new Set(entries.map((e) => e.action))).sort();

  const exportCsv = () => {
    const csv = toCsv(
      ["id", "createdAt", "actorId", "actorName", "action", "metadata"],
      entries.map((e) => [e.id, e.createdAt, e.actorId, e.actorName, e.action, e.metadata]),
    );
    downloadCsv("audit-log.csv", csv);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <button
            type="button"
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <label htmlFor="audit-actor" className="text-sm font-medium text-gray-700">
              Actor
            </label>
            <input
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Actor id"
              className="rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="audit-action" className="text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              id="audit-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm"
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              {action && !actions.includes(action) && <option value={action}>{action}</option>}
            </select>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        {isLoading && <p role="status">Loading audit log…</p>}
        {isError && (
          <div role="alert" className="text-sm text-red-700">
            Could not load the audit log.{" "}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && entries.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600">No entries match.</p>
        )}

        {entries.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isOpen = expanded === entry.id;
                  return (
                    <Fragment key={entry.id}>
                      <tr className="border-t border-gray-100">
                        <td className="px-4 py-3">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{entry.actorName}</td>
                        <td className="px-4 py-3">{entry.action}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : entry.id)}
                            className="text-emerald-700 underline"
                          >
                            {isOpen ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-3">
                            {/* Rendered as a React text node, so markup in metadata stays inert. */}
                            <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <AdminOnly>
      <AuditLogViewer />
    </AdminOnly>
  );
}
