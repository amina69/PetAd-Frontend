# In-app messaging

Conversation list, message thread with infinite scroll upward, composer with
optimistic send and attachments, and live delivery over a WebSocket.

| Piece | Location |
|-------|----------|
| Module | `src/features/messaging/` |
| Page / routes | `src/pages/MessagesPage.tsx` at `/messages` and `/messages/:conversationId` (protected) |
| Mocks | `src/mocks/handlers/messages.ts` (`resetMessagesMock()` for tests) |
| Current user | `src/features/messaging/hooks/useMessagingUser.ts` (reads the `petad_user` entry `SignInForm` writes at login) |

## API contract (mocked until the backend lands)

```
GET  /conversations
GET  /conversations/:id/messages?cursor=&limit=   → { data (oldest→newest), nextCursor }   newest page first
POST /conversations/:id/messages                  JSON { body, clientId } or multipart (body, clientId, files[])
POST /conversations/:id/messages/read             { messageIds }
GET  /messages/:messageId/attachments/:attachmentId/url → { url, expiresAt }
WS   /api/ws/messages?token=…                     MESSAGE_CREATED (Message) · MESSAGES_READ ({ conversationId, messageIds, readAt })
```

`POST …/messages` must be **idempotent on `clientId`**: a retry returns the
original message instead of creating a second one.

## Behaviour

- **Thread (`MessageThread`, `useMessages`)** — `useInfiniteQuery`; page 0 is the newest page and `fetchNextPage` loads older messages. Before a prepend we remember the top message and its offset, then re-pin it, so the viewport does not jump. New messages scroll to the bottom only if the user was within 80 px of it (or sent the message); otherwise a "N new messages" button appears. Messages are grouped by day; bubbles align by `senderId` vs `useCurrentUser()`.
- **Composer (`MessageComposer`, `useSendMessage`)** — Enter sends, Shift+Enter inserts a newline, Send is disabled when empty. The temp message shows `sending`, then `sent` or `failed` (Retry / Delete). Retries reuse the `clientId`, and the cache collapses copies by `id` or `clientId`, so neither a retry nor a socket echo can duplicate a message. Drafts (text and queued files) live in memory per conversation (`draftStore.ts`).
- **Attachments (`uploadRules.ts`, `AttachmentChips`)** — images (JPG/PNG/WebP/GIF) and PDFs, max 3 per message, 5 MB each, with specific error copy. Images render inline with alt text `Image sent by <name>` and open a preview; other files are file cards whose download fetches a short-lived URL at click time.
- **Realtime (`useMessageSocketSync`)** — built on `createNotificationSocket`. Events are merged into the Query cache (no refetch): a message in a thread that isn't open bumps that conversation's unread badge in place. A reconnect triggers one backfill invalidation.
- **Read state (`useMarkMessagesRead`)** — an `IntersectionObserver` marks an incoming message read after it has been ≥ 60 % visible for 1 s **while the tab is visible and focused**. Hiding or blurring the tab pauses the timers.

## Hook usage

```tsx
import { MessageThread, MessageComposer, useMessageSocketSync } from "src/features/messaging";

function Thread({ id }: { id: string }) {
  useMessageSocketSync({ activeConversationId: id });
  return (
    <>
      <div className="h-96"><MessageThread conversationId={id} /></div>
      <MessageComposer conversationId={id} />
    </>
  );
}
```

`MessageThread` needs a parent with a bounded height (it scrolls internally).
