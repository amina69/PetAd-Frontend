import { useApiHealth } from "../../hooks/useApiHealth";

/**
 * Non-blocking degraded-mode banner.
 *
 * Appears only after repeated API outages (see `useApiHealth`) and disappears
 * automatically on the next successful request. It never covers content and
 * is announced politely to assistive technology.
 */
export function ApiStatusBanner() {
  const { isDegraded, statusPageUrl } = useApiHealth();

  if (!isDegraded) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span>
          We&apos;re having trouble reaching the server. Some data may be out of
          date.
        </span>
        {statusPageUrl ? (
          <a
            href={statusPageUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            View status page
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default ApiStatusBanner;
