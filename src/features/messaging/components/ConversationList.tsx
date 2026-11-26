import { NavLink } from "react-router-dom";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useConversations } from "../hooks/useMessages";

/** Conversations with live unread badges (patched in place by the socket). */
export function ConversationList() {
  const { data, isPending, isError, refetch } = useConversations();

  if (isPending) return <p className="p-4 text-sm text-gray-500" role="status">Loading conversations…</p>;
  if (isError) {
    return (
      <div className="p-4 text-sm" role="alert">
        <p className="text-red-600">Couldn't load conversations.</p>
        <button type="button" onClick={() => void refetch()} className="font-medium text-[#E84D2A] hover:underline">
          Try again
        </button>
      </div>
    );
  }
  if (data.length === 0) return <p className="p-4 text-sm text-gray-500">No conversations yet.</p>;

  return (
    <ul aria-label="Conversations" className="divide-y divide-gray-100">
      {data.map((conversation) => (
        <li key={conversation.id}>
          <NavLink
            to={`/messages/${conversation.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`
            }
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                  {conversation.title}
                </span>
                <time dateTime={conversation.updatedAt} className="shrink-0 text-[11px] text-gray-400">
                  {formatDistanceToNowStrict(parseISO(conversation.updatedAt))}
                </time>
              </span>
              <span className="block truncate text-xs text-gray-500">
                {conversation.lastMessage?.body || (conversation.lastMessage?.attachments.length ? "Sent an attachment" : "")}
              </span>
            </span>
            {conversation.unreadCount > 0 && (
              <span
                data-testid="unread-badge"
                aria-label={`${conversation.unreadCount} unread`}
                className="min-w-[20px] rounded-full bg-[#E84D2A] px-1.5 py-0.5 text-center text-[11px] font-bold text-white"
              >
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
