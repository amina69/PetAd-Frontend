# Notifications

In-app notification centre (bell dropdown, `/notifications` page), per-type
preferences, deep links, and real-time delivery. Transport and envelope
decisions live in [`../notifications.md`](../notifications.md); the realtime
flow diagram is in [`../architecture.md`](../architecture.md#2-realtime-flow).

> Import paths in the snippets are relative to `src/` (the project has no `@/` alias).

| Piece | Location |
|-------|----------|
| Feature module | `src/features/notifications/` — `hooks/` (`useMarkNotificationRead`, `usePreferences`, `useUnreadNotificationCount`, `useNotificationSocket`), `components/NotificationPreferences.tsx`, `types/` |
| Realtime | `src/context/NotificationSocketContext.tsx` (mounted in `main.tsx`), `src/lib/realtime/notificationSocket.ts` (manager, not mounted) |
| Hooks | `src/hooks/useNotifications.ts`, `useMutateMarkRead.ts`, `useMutateMarkAllRead.ts`, `useNotificationPreferences.ts`, `useNotificationDeepLink.ts`, `src/lib/hooks/useNotificationCount.ts` |
| Components | `src/components/layout/NotificationBell.tsx`, `NotificationDropdown.tsx`, `src/components/notifications/` |
| Routing helper | `src/lib/notificationRouter.ts` (notification → destination URL) |
| Routes | `/notifications`, `/notification-preferences`, `/settings/notifications` |
| Mocks | `src/mocks/handlers/notify.ts` |

## Hook usage

Infinite list with a filter (`"all" | "unread" | "read"`). Read events are
batched into one cache write per 250 ms window:

```tsx
import { useNotifications } from "src/hooks/useNotifications";

const { notifications, hasNextPage, fetchNextPage, markRead } =
  useNotifications("unread");
```

Navbar badge (refreshed by socket pushes and reconnects):

```tsx
import { useUnreadNotificationCount } from "src/features/notifications";

const unread = useUnreadNotificationCount();
```

Mark one as read (optimistic, rolls back on failure):

```tsx
import { useMarkNotificationRead } from "src/features/notifications";

const { markAsRead } = useMarkNotificationRead();
markAsRead(notification.id);
```

Connection state for UI affordances (must be under `NotificationSocketProvider`):

```tsx
import { useNotificationSocket } from "src/context/NotificationSocketContext";

const { connectionState, reconnectAttempts, reconnect } = useNotificationSocket();
// connectionState: "connected" | "reconnecting" | "disconnected"
```

Preference toggles (per-type PATCH with optimistic update and per-toggle
rollback):

```tsx
import { usePreferences } from "src/features/notifications";

const prefs = usePreferences();
```

Deep links: mount `useNotificationDeepLink()` once near the router. It reads
`?notificationId=`, marks it read and navigates via `notificationRouter`.

> `useNotificationSocket` exported from `features/notifications` is the
> framework-agnostic manager's React binding; the context hook of the same name
> is the one backing the running app. Import from the path shown above to avoid
> picking the wrong one.
