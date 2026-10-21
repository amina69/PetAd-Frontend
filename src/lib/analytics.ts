/**
 * Analytics reporting gated by VITE_ENABLE_ANALYTICS (issue 97).
 * Client-side error reporting is a no-op unless the flag is explicitly enabled.
 */
export function isAnalyticsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ANALYTICS === "true";
}

export function reportError(error: Error, componentStack?: string | null): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  const payload = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    componentStack: componentStack ?? undefined,
    at: new Date().toISOString(),
  };

  console.info("[analytics] error", payload);
}
