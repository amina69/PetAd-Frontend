import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAdoptionTimeline } from "../hooks/useAdoptionTimeline";
import { TimelineEntry } from "../components/ui/TimelineEntry";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";
import type { AdoptionTimelineEntry as TimelineEntryType } from "../types/adoption";

export default function AdoptionTimelinePage() {
  const { adoptionId } = useParams<{ adoptionId: string }>();
  const { entries, isLoading, isError } = useAdoptionTimeline(adoptionId || "");

  const groupedEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { title: string; items: TimelineEntryType[] }[] = [
      { title: "Today", items: [] },
      { title: "Yesterday", items: [] },
      { title: "Earlier", items: [] },
    ];

    entries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate >= today) {
        groups[0].items.push(entry);
      } else if (entryDate >= yesterday) {
        groups[1].items.push(entry);
      } else {
        groups[2].items.push(entry);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [entries]);

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <EmptyState
          title="Error loading timeline"
          description="Failed to fetch timeline events. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/adoption/${adoptionId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Adoption
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Adoption Timeline</h1>
        <p className="text-gray-600">Track the status of adoption #{adoptionId?.slice(0, 8)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="row" className="h-20" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            title="No status changes yet"
            description="This adoption application doesn't have any timeline events yet."
          />
        ) : (
          <div className="space-y-8">
            {groupedEntries.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 px-3">
                  {group.title}
                </h3>
                <ul className="relative">
                  {/* Vertical line connecting entries */}
                  <div className="absolute top-0 bottom-0 left-8 w-px bg-gray-200" aria-hidden="true" />
                  
                  {group.items.map((entry, index) => {
                    const isFirstOverall = entries[0] === entry;
                    
                    return (
                      <div 
                        key={`${entry.timestamp}-${index}`} 
                        className={`relative z-10 ${isFirstOverall ? 'rounded-lg ring-1 ring-orange-200 bg-orange-50/50' : ''}`}
                        data-testid={`timeline-entry${isFirstOverall ? '-latest' : ''}`}
                      >
                        <TimelineEntry entry={entry} />
                      </div>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
