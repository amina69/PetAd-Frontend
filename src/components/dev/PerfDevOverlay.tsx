import { useEffect, useState } from "react";
import {
  clearPerfMeasures,
  getPerfMeasures,
  subscribePerf,
  type PerfMeasureRecord,
} from "../../lib/perf";

export interface PerfDevOverlayProps {
  /** Force overlay visibility regardless of environment (useful for testing). */
  forceVisible?: boolean;
}

export function PerfDevOverlay({ forceVisible = false }: PerfDevOverlayProps) {
  const [measures, setMeasures] = useState<PerfMeasureRecord[]>(() => getPerfMeasures());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isEnabled =
    forceVisible ||
    import.meta.env.DEV ||
    (typeof window !== "undefined" &&
      (window.localStorage.getItem("perf_overlay") === "true" ||
        window.localStorage.getItem("petad:perf") === "true"));

  useEffect(() => {
    if (!isEnabled) return;

    // Load initial measures
    setMeasures(getPerfMeasures());

    // Subscribe to new measures
    const unsubscribe = subscribePerf(() => {
      setMeasures(getPerfMeasures());
    });

    return unsubscribe;
  }, [isEnabled]);

  if (!isEnabled) return null;

  const handleClear = () => {
    clearPerfMeasures();
    setMeasures([]);
  };

  const getDurationBadgeClass = (ms: number) => {
    if (ms < 100) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (ms < 300) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  };

  return (
    <aside
      aria-label="Performance Dev Overlay"
      data-testid="perf-dev-overlay"
      className="fixed bottom-4 right-4 z-50 flex flex-col font-mono text-xs shadow-2xl rounded-xl border border-slate-700/80 bg-slate-900/95 text-slate-100 backdrop-blur-md transition-all duration-200"
      style={{ maxWidth: isCollapsed ? "180px" : "360px", minWidth: "180px" }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/60 rounded-t-xl gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>⚡ Perf Overlay</span>
        </div>
        <div className="flex items-center gap-1">
          {!isCollapsed && measures.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              data-testid="perf-overlay-clear"
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear recorded measures"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            data-testid="perf-overlay-toggle"
            className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand overlay" : "Collapse overlay"}
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {/* Content panel */}
      {!isCollapsed && (
        <div className="p-2.5 max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60">
          {measures.length === 0 ? (
            <div
              data-testid="perf-overlay-empty"
              className="text-slate-500 py-3 text-center italic"
            >
              No timings recorded yet
            </div>
          ) : (
            measures.map((item) => (
              <div
                key={item.id}
                data-testid={`perf-measure-${item.name}`}
                className="pt-1.5 first:pt-0 flex items-center justify-between gap-2"
              >
                <span className="truncate text-slate-300 font-medium" title={item.name}>
                  {item.name}
                </span>
                <span
                  data-testid={`perf-duration-${item.name}`}
                  className={`px-1.5 py-0.5 rounded border text-[11px] font-bold shrink-0 ${getDurationBadgeClass(
                    item.duration,
                  )}`}
                >
                  {item.duration}ms
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
