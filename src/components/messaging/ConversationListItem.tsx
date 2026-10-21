import { Link } from "react-router-dom";
import type { Conversation } from "../../features/messaging/types/message";

interface Props {
  conversation: Conversation;
  isSelected: boolean;
}

export function ConversationListItem({ conversation, isSelected }: Props) {
  const participantNames = conversation.participants
    .map((participant) => participant.name)
    .join(", ");

  return (
    <Link
      to={`/messages/${encodeURIComponent(conversation.id)}`}
      aria-current={isSelected ? "page" : undefined}
      className={`block border-b border-gray-100 px-4 py-4 transition-colors hover:bg-orange-50 ${
        isSelected ? "bg-orange-50" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {participantNames || "Conversation"}
          </p>
          <p className="mt-1 truncate text-sm text-gray-500">
            {conversation.lastMessage.body}
          </p>
        </div>
        {conversation.unreadCount > 0 && (
          <span
            aria-label={`${conversation.unreadCount} unread messages`}
            className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-xs font-semibold text-white"
          >
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <time
        dateTime={conversation.updatedAt}
        className="mt-2 block text-xs text-gray-400"
      >
        {new Date(conversation.updatedAt).toLocaleString()}
      </time>
    </Link>
  );
}
