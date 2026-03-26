import { useMemo } from "react";
import { AdoptionStatusBadge } from "../components/ui/AdoptionStatusBadge";
import {
  StatusFilterChips,
  formatAdoptionStatusLabel,
} from "../components/ui/StatusFilterChips";
import { EmptyState } from "../components/ui/emptyState";
import { useAdoptionList } from "../hooks/useAdoptionList";
import { useUrlSync } from "../hooks/useUrlSync";
import {
  ADOPTION_STATUS_OPTIONS,
  type AdoptionRequest,
  type AdoptionStatus,
} from "../types/adoption";

type UrlState = {
  status: AdoptionStatus[] | AdoptionStatus | string[] | string;
};

function normalizeStatuses(value: UrlState["status"]): AdoptionStatus[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean) as AdoptionStatus[];
  }

  if (typeof value === "string" && value.length > 0) {
    return [value as AdoptionStatus];
  }

  return [];
}

function buildNextStatuses(
  currentStatuses: AdoptionStatus[],
  status: AdoptionStatus,
): AdoptionStatus[] {
  return currentStatuses.includes(status)
    ? currentStatuses.filter((value) => value !== status)
    : [...currentStatuses, status];
}

function getEmptyStateTitle(selectedStatuses: AdoptionStatus[]) {
  if (selectedStatuses.length === 1) {
    return "No " + formatAdoptionStatusLabel(selectedStatuses[0]).toLowerCase() + " adoptions";
  }

  return "No matching adoptions";
}

function getEmptyStateDescription(selectedStatuses: AdoptionStatus[]) {
  if (selectedStatuses.length > 0) {
    return "Try a different status filter to see other adoption requests.";
  }

  return "Adoption requests will appear here once they are created.";
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function AdoptionRequestRow({ request }: { request: AdoptionRequest }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-sm md:grid-cols-[1.6fr_1fr_auto] md:items-center">
      <div className="flex items-center gap-4 min-w-0">
        <img
          src={request.petImageUrl}
          alt={request.petName}
          className="h-16 w-16 rounded-xl object-cover bg-gray-100"
        />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[#0D162B]">
            {request.petName}
          </h2>
          <p className="truncate text-sm text-[#686677]">
            {request.petBreed}, {request.petAge}
          </p>
          <p className="mt-1 truncate text-sm text-[#4D5761]">
            Adopter: {request.adopterName}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-sm text-[#4D5761]">
        <p>{request.location}</p>
        <p>Updated {formatDate(request.updatedAt)}</p>
      </div>

      <div className="justify-self-start md:justify-self-end">
        <AdoptionStatusBadge status={request.status} />
      </div>
    </article>
  );
}

export default function InterestPage() {
  const [urlState, setUrlState] = useUrlSync<UrlState>({ status: [] });
  const selectedStatuses = normalizeStatuses(urlState.status);
  const { data, isLoading, isError, error } = useAdoptionList({
    status: selectedStatuses,
  });

  const requests = data ?? [];

  const counts = useMemo(() => {
    return selectedStatuses.reduce((result, status) => {
      result[status] = requests.filter((request) => request.status === status).length;
      return result;
    }, {} as Partial<Record<AdoptionStatus, number>>);
  }, [requests, selectedStatuses]);

  const handleToggleStatus = (status: AdoptionStatus) => {
    setUrlState({ status: buildNextStatuses(selectedStatuses, status) });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#001323]">
                Adoption Requests ({requests.length})
              </h1>
              <p className="text-sm text-[#4D5761]">
                Filter adoption requests by status and keep the URL in sync.
              </p>
            </div>
          </div>

          <StatusFilterChips
            options={ADOPTION_STATUS_OPTIONS}
            selectedStatuses={selectedStatuses}
            counts={counts}
            onToggle={handleToggleStatus}
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[#EAEAEA] bg-white px-6 py-12 text-center text-sm text-[#4D5761]">
            Loading adoption requests...
          </div>
        ) : null}

        {!isLoading && isError ? (
          <EmptyState
            title="Unable to load adoption requests"
            description={error?.message ?? "Please try again shortly."}
          />
        ) : null}

        {!isLoading && !isError && requests.length === 0 ? (
          <EmptyState
            title={getEmptyStateTitle(selectedStatuses)}
            description={getEmptyStateDescription(selectedStatuses)}
            action={
              selectedStatuses.length > 0
                ? {
                    label: "Clear filters",
                    onClick: () => setUrlState({ status: [] }),
                  }
                : undefined
            }
          />
        ) : null}

        {!isLoading && !isError && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <AdoptionRequestRow key={request.id} request={request} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
