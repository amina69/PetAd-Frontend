import { Check, Pause, Plus, Wallet } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { StellarTxLink } from "../ui/StellarTxLink";
import { useEscrowTimeline, type EscrowTimelineEventType } from "../../lib/hooks/useEscrowTimeline";

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

function getEventIcon(type: EscrowTimelineEventType) {
  const normalized = String(type).toUpperCase();

  if (normalized === "CREATED") return Plus;
  if (normalized === "FUNDED") return Wallet;
  if (normalized === "PAUSED" || normalized === "DISPUTED") return Pause;
  if (normalized === "SETTLED") return Check;

  return Plus;
}

function extractTxHash(stellarExplorerUrl: string): string | null {
  if (!stellarExplorerUrl) return null;

  try {
    const parsed = new URL(stellarExplorerUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    // If it's already a hash or a non-standard URL, best-effort.
    const trimmed = stellarExplorerUrl.trim();
    return trimmed.length ? trimmed : null;
  }
}

interface EscrowTimelinePanelProps {
  adoptionId: string;
}

export function EscrowTimelinePanel({ adoptionId }: EscrowTimelinePanelProps) {
  const { data, isLoading, isError } = useEscrowTimeline(adoptionId);

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="escrow-timeline-panel"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Escrow Timeline
      </p>

      {isLoading ? (
        <div className="mt-6 space-y-3" data-testid="escrow-timeline-skeleton">
          <Skeleton variant="row" className="rounded-2xl" />
          <Skeleton variant="row" className="rounded-2xl" />
          <Skeleton variant="row" className="rounded-2xl" />
        </div>
      ) : isError ? (
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900"
          data-testid="escrow-timeline-error"
        >
          Unable to load escrow timeline.
        </div>
      ) : !data || data.length === 0 ? (
        <div
          className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
          data-testid="escrow-timeline-empty"
        >
          No escrow events yet
        </div>
      ) : (
        <ol className="mt-6 space-y-6 border-l border-slate-200 pl-8">
          {[...data]
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            )
            .map((event, index) => {
              const isLatest = index === 0;
              const Icon = getEventIcon(event.type);
              const relative = formatRelativeTime(event.timestamp);
              const txHash = event.stellarExplorerUrl
                ? extractTxHash(event.stellarExplorerUrl)
                : null;

              const cardClasses = isLatest
                ? "border-sky-200 bg-sky-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 opacity-75";

              const iconClasses = isLatest
                ? "border-sky-200 bg-white text-sky-700"
                : "border-slate-200 bg-slate-50 text-slate-500";

              return (
                <li className="relative" data-latest={isLatest} key={`${event.type}-${event.timestamp}`}>
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

                    {txHash ? (
                      <div className="mt-3">
                        <StellarTxLink id={txHash} type="tx" />
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
        </ol>
      )}
    </section>
  );
}

