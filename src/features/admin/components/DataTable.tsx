import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  pageCount: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onSortChange?: (sort: { field: string; direction: "asc" | "desc" } | null) => void;
  onPageChange?: (page: number) => void;
  renderCard?: (row: T) => ReactNode;
  emptyMessage?: string;
}

/** Accessible server-driven table. Sort and page state are encoded in the URL. */
export function DataTable<T>({
  columns, rows, getRowId, pageCount, loading = false, error = false,
  onRetry, onSortChange, onPageChange, renderCard, emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const sortField = searchParams.get("sort") ?? "";
  const direction = searchParams.get("direction") === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const visibleIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => value === null ? next.delete(key) : next.set(key, value));
    setSearchParams(next, { replace: true });
  };

  const sortBy = (columnId: string) => {
    const nextDirection = sortField === columnId && direction === "asc" ? "desc" : "asc";
    const sort = { field: columnId, direction: nextDirection } as const;
    updateParams({ sort: columnId, direction: nextDirection, page: "1" });
    onSortChange?.(sort);
    if (page !== 1) onPageChange?.(1);
  };

  const changePage = (nextPage: number) => {
    const safePage = Math.min(Math.max(1, nextPage), Math.max(1, pageCount));
    updateParams({ page: String(safePage) });
    onPageChange?.(safePage);
  };

  const toggleAll = () => setSelected((previous) => {
    const next = new Set(previous);
    visibleIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
    return next;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {selected.size > 0 && <p className="border-b border-slate-200 px-4 py-2 text-sm text-slate-700" aria-live="polite">{selected.size} row{selected.size === 1 ? "" : "s"} selected</p>}
      {error ? <div role="alert" className="p-6 text-center"><p className="text-rose-700">Unable to load records.</p>{onRetry && <button className="mt-2 font-semibold text-emerald-800 underline" type="button" onClick={onRetry}>Retry</button>}</div> : (
        <>
          {renderCard && <div className="divide-y divide-slate-200 md:hidden">{loading ? <p role="status" className="p-6 text-slate-500">Loading records…</p> : rows.map((row) => <article key={getRowId(row)} className="p-4">{renderCard(row)}</article>)}</div>}
          <div className={`overflow-x-auto ${renderCard ? "hidden md:block" : ""}`}>
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr>
                <th scope="col" className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all rows on this page" checked={allSelected} onChange={toggleAll} /></th>
                {columns.map((column) => <th key={column.id} scope="col" aria-sort={sortField === column.id ? (direction === "asc" ? "ascending" : "descending") : "none"} className={`px-4 py-3 ${column.className ?? ""}`}>
                  {column.sortable ? <button type="button" onClick={() => sortBy(column.id)} className="inline-flex items-center gap-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600" aria-label={`Sort by ${column.header}${sortField === column.id ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}>
                    {column.header}{sortField === column.id && <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span>}
                  </button> : column.header}
                </th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={columns.length + 1} role="status" className="px-4 py-8 text-center text-slate-500">Loading records…</td></tr> : rows.length === 0 ? <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-500">{emptyMessage}</td></tr> : rows.map((row) => {
                  const id = getRowId(row);
                  return <tr key={id} className="hover:bg-slate-50"><td className="px-4 py-3"><input type="checkbox" aria-label={`Select row ${id}`} checked={selected.has(id)} onChange={() => setSelected((previous) => {
                    const next = new Set(previous);
                    if (next.has(id)) {
                      next.delete(id);
                    } else {
                      next.add(id);
                    }
                    return next;
                  })} /></td>{columns.map((column) => <td key={column.id} className={`px-4 py-3 text-slate-800 ${column.className ?? ""}`}>{column.accessor(row)}</td>)}</tr>;
                })}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-600" aria-live="polite">Page {page} of {Math.max(pageCount, 1)}</span>
            <div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Previous</button><button type="button" disabled={page >= pageCount || loading} onClick={() => changePage(page + 1)} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Next</button></div>
          </footer>
        </>
      )}
    </div>
  );
}
