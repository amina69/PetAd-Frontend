/**
 * Per-domain `staleTime` policy (ms). Every query hook imports one of these
 * and carries a one-line comment justifying the choice.
 *
 * - PETS: listings/details change rarely and are the heaviest public pages.
 * - APPROVALS: operators act on them, so they must not drift for long.
 * - NOTIFICATIONS: live; always stale so focus/mount/polling refetch.
 * - DOCUMENTS: reviewed out-of-band, so they are refetched on window focus.
 * - TIMELINES: append-only event logs; a short cache avoids per-navigation refetches.
 */
export const STALE_TIME = {
  PETS: 5 * 60_000,
  APPROVALS: 60_000,
  NOTIFICATIONS: 0,
  DOCUMENTS: 0,
  TIMELINES: 30_000,
  DISPUTES: 15_000,
} as const;
