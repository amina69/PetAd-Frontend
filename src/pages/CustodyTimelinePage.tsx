import { useParams } from "react-router-dom";
import { Check, Pause, Plus, Wallet } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useCustodyTimeline, type CustodyTimelineEventType } from "../lib/hooks/useCustodyTimeline";
import { useCustodyDetails } from "../lib/hooks/useCustodyDetails";
import { CustodyExpiringBanner } from "../components/custody";
import type { CustodyTimelineEvent } from "../api/custodyService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: string, now = new Date()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) return rtf.format(diffSeconds, "second");

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

function getEventIcon(type: CustodyTimelineEventType) {
  const normalized = String(type).toUpperCase();
  if (normalized === "CREATED") return Plus;
  if (normalized === "FUNDED") return Wallet;
  if (normalized === "PAUSED" || normalized === "DISPUTED") return Pause;
  if (normalized === "SETTLED") return Check;
  return Plus;
}

function getDateLabel(timestamp: string, now = new Date()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const evDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (nowDate.getTime() - evDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Date-grouped timeline
// ---------------------------------------------------------------------------

interface DateGroup {
  label: string;
  events: CustodyTimelineEvent[];
}

function groupByDate(events: CustodyTimelineEvent[]): DateGroup[] {
  const now = new Date();
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const groups: DateGroup[] = [];
  const seen = new Map<string, DateGroup>();

  for (const event of sorted) {
    const label = getDateLabel(event.timestamp, now);
    if (!seen.has(label)) {
      const group: DateGroup = { label, events: [] };
      groups.push(group);
      seen.set(label, group);
    }
    seen.get(label)!.events.push(event);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CustodyTimelinePage() {
  const { custodyId } = useParams<{ custodyId: string }>();
  const { data, isLoading, isError } = useCustodyTimeline(custodyId);
  const { data: custodyDetails } = useCustodyDetails(custodyId);

  const groups = data && data.length > 0 ? groupByDate(data) : [];
  const isLatestEvent = (groupIdx: number, eventIdx: number) =>
    groupIdx === 0 && eventIdx === 0;

  const showExpiringBanner =
    custodyDetails?.status === "EXPIRING_SOON" &&
    Boolean(custodyDetails.endDate);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {/* Page Header */}
        <section className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Custody
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Custody Timeline</h1>
          {custodyId && (
            <p className="mt-2 text-sm text-slate-400">ID: {custodyId}</p>
          )}
        </section>

        {/* Expiring Banner */}
        {showExpiringBanner && custodyId && (
          <CustodyExpiringBanner
            custodyId={custodyId}
            endDate={custodyDetails.endDate!}
          />
        )}

        {/* Timeline Panel */}
        <section
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="custody-timeline-panel"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Custody Timeline
          </p>

          {isLoading ? (
            <div className="mt-6 space-y-3" data-testid="custody-timeline-skeleton">
              <Skeleton variant="row" className="rounded-2xl" />
              <Skeleton variant="row" className="rounded-2xl" />
              <Skeleton variant="row" className="rounded-2xl" />
            </div>
          ) : isError ? (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900"
              data-testid="custody-timeline-error"
            >
              Unable to load custody timeline.
            </div>
          ) : groups.length === 0 ? (
            <div
              className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
              data-testid="custody-timeline-empty"
            >
              No custody events yet.
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {groups.map((group, groupIdx) => (
                <div key={group.label}>
                  {/* Date separator */}
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <ol className="space-y-6 border-l border-slate-200 pl-8">
                    {group.events.map((event, eventIdx) => {
                      const latest = isLatestEvent(groupIdx, eventIdx);
                      const Icon = getEventIcon(event.type);
                      const relative = formatRelativeTime(event.timestamp);

                      const cardClasses = latest
                        ? "border-sky-200 bg-sky-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 opacity-75";

                      const iconClasses = latest
                        ? "border-sky-200 bg-white text-sky-700"
                        : "border-slate-200 bg-slate-50 text-slate-500";

                      return (
                        <li
                          className="relative"
                          data-latest={latest}
                          key={`${event.type}-${event.timestamp}`}
                        >
                          <div
                            className={`absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full border ${iconClasses}`}
                            aria-hidden="true"
                          >
                            <Icon size={16} />
                          </div>

                          <div className={`rounded-2xl border p-4 ${cardClasses}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-sm font-semibold">{event.label}</p>
                              {relative ? (
                                <time
                                  className="text-xs font-medium text-slate-500"
                                  dateTime={event.timestamp}
                                >
                                  {relative}
                                </time>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
