import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCustodyList } from "../features/custody/hooks/useCustodyList";
import { useCustodyViewer } from "../features/custody/hooks/useCustodyViewer";
import { CustodyCard } from "../features/custody/components/CustodyCard";
import type { CustodyStatus } from "../features/custody/types";

/**
 * The dashboard tabs.
 *
 * Every tab maps to the statuses the API can be asked for, so the list is
 * always filtered by the server.
 */
const TABS: {
  value: string;
  label: string;
  statuses: CustodyStatus[];
}[] = [
  { value: "active", label: "Active", statuses: ["active", "disputed"] },
  {
    value: "upcoming",
    label: "Upcoming",
    statuses: ["requested", "approved"],
  },
  { value: "past", label: "Past", statuses: ["completed", "cancelled"] },
];

const DEFAULT_TAB = "active";
const PAGE_SIZE = 10;

function isKnownTab(value: string | null): boolean {
  return TABS.some((tab) => tab.value === value);
}

/**
 * CustodyDashboardPage — `/custody`.
 *
 * Lists the custody arrangements of the signed-in user in three tabs
 * (Active / Upcoming / Past). The active tab and the page are both kept in
 * the URL so a view can be shared or reloaded.
 */
export default function CustodyDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useCustodyViewer();

  const tabParam = searchParams.get("tab");
  const activeTab = isKnownTab(tabParam) ? tabParam : DEFAULT_TAB;

  const pageParam = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const tab = useMemo(
    () => TABS.find((candidate) => candidate.value === activeTab) ?? TABS[0],
    [activeTab],
  );

  const params = useMemo(
    () => ({ status: tab.statuses, page, limit: PAGE_SIZE }),
    [tab, page],
  );

  const { data, isLoading, isError, error, refetch } = useCustodyList(params);

  const handleTabChange = useCallback(
    (value: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set("tab", value);
        // A new tab starts at the first page again.
        next.delete("page");

        return next;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (value: number) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (value <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(value));
        }

        return next;
      });
    },
    [setSearchParams],
  );

  const arrangements = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // The pets the user already has an arrangement for are the ones they can
  // extend, so the call to action points at the first of them.
  const firstArrangement = arrangements[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Temporary custody</h1>
          <p className="mt-1 text-sm text-gray-600">
            Every arrangement you are part of, as owner or as caretaker.
          </p>
        </div>

        {firstArrangement && (
          <Link
            to={`/pets/${firstArrangement.petId}/custody/new`}
            className="rounded-xl bg-[#E84D2A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d34424]"
            data-testid="custody-request-new"
          >
            {firstArrangement.petName
              ? `Request custody for ${firstArrangement.petName}`
              : "Request custody"}
          </Link>
        )}
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Custody periods"
        className="flex w-fit gap-1 rounded-lg bg-gray-100 p-1"
      >
        {TABS.map((candidate) => (
          <button
            key={candidate.value}
            type="button"
            role="tab"
            aria-selected={candidate.value === activeTab}
            aria-controls="custody-tab-panel"
            data-testid={`custody-tab-${candidate.value}`}
            onClick={() => handleTabChange(candidate.value)}
            className={[
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              candidate.value === activeTab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        id="custody-tab-panel"
        role="tabpanel"
        tabIndex={0}
        className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-6"
      >
        {isLoading ? (
          <p role="status" aria-live="polite" className="text-sm text-gray-600">
            Loading custody arrangements…
          </p>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-red-600" data-testid="custody-list-error">
              {error?.message ?? "We could not load your custody arrangements."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Try again
            </button>
          </div>
        ) : arrangements.length === 0 ? (
          <p className="text-sm text-gray-600" data-testid="custody-list-empty">
            {tab.label === "Active"
              ? "You have no active custody arrangements."
              : tab.label === "Upcoming"
                ? "You have no upcoming custody arrangements."
                : "You have no past custody arrangements."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {arrangements.map((arrangement) => (
              <li key={arrangement.id}>
                <CustodyCard arrangement={arrangement} viewerId={userId} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Custody pagination"
          className="flex items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            data-testid="custody-page-previous"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600" data-testid="custody-page-label">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            data-testid="custody-page-next"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
