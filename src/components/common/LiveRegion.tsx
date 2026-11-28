import type { ReactNode } from "react";

interface LiveRegionProps {
  children: ReactNode;
  assertive?: boolean;
}

/** Announces async status and validation summaries without moving focus. */
export function LiveRegion({ children, assertive = false }: LiveRegionProps) {
  return (
    <div
      className="sr-only"
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {children}
    </div>
  );
}
