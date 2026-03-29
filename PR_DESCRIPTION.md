# PR Summary

Implements `useNotificationCount`, a new hook that polls unread notification count for the nav badge and resets the count when the notification centre is opened.

## What changed

- Added `src/lib/hooks/useNotificationCount.ts`
  - polls `GET /notifications?status=UNREAD&limit=0`
  - returns `{ count, isLoading }`
  - pauses polling when the browser tab is hidden
  - marks all notifications read and resets count to `0` when the route changes to `/notifications`

- Updated `src/lib/hooks/index.ts`
  - exported `useNotificationCount`

- Updated `src/mocks/handlers/notify.ts`
  - added mock support for `status=UNREAD&limit=0` count responses

- Added unit tests in `src/lib/hooks/__tests__/useNotificationCount.test.tsx`
  - validates unread count is returned
  - validates polling pauses on hidden tab
  - validates count resets to `0` when notification centre opens

## Why this matters

This hook powers the notification badge UX by keeping the unread count fresh and ensuring the badge clears when the user views the notification centre. It also avoids unnecessary polling when the app is not visible.

## Testing

Run:

```bash
node_modules/.bin/vitest run src/lib/hooks/__tests__/useNotificationCount.test.tsx
```

Also validate polling hook integration:

```bash
node_modules/.bin/vitest run src/lib/hooks/__tests__/usePolling.test.tsx src/lib/hooks/__tests__/useNotificationCount.test.tsx
```

## Notes

- Uses the existing `usePolling` hook and `apiClient` infrastructure for consistency.
- The notification count hook is designed to be simple and reusable for any badge or nav component that needs unread notification state.
