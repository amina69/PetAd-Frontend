import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useConversations, useConversationMessages } from "../features/messaging/hooks/useConversations";
import { ConversationListItem } from "../components/messaging/ConversationListItem";

function ConversationPanel({ conversationId }: { conversationId: string }) {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } =
    useConversationMessages(conversationId);
  const messages =
    data?.pages
      .flatMap((page) => page.items)
      .sort(
        (left, right) =>
          new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
      ) ?? [];

  return (
    <section className="flex min-h-[32rem] flex-1 flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={() => navigate("/messages", { replace: true })}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-semibold text-gray-900">Conversation</h2>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {hasNextPage && (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mx-auto block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading older messages…" : "Load older messages"}
          </button>
        )}
        {isLoading && <p role="status">Loading messages…</p>}
        {isError && (
          <div role="alert" className="text-sm text-red-700">
            <p>Messages could not be loaded.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && messages.length === 0 && (
          <p className="text-sm text-gray-500">No messages in this conversation yet.</p>
        )}
        {messages.map((message) => (
          <article
            key={message.id}
            className="max-w-2xl rounded-xl bg-gray-50 px-4 py-3"
          >
            <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
              {message.body}
            </p>
            {message.attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {message.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-orange-700 underline"
                    >
                      {attachment.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <time
              dateTime={message.sentAt}
              className="mt-2 block text-xs text-gray-400"
            >
              {new Date(message.sentAt).toLocaleString()}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MessagesPage() {
  const { id = "" } = useParams<{ id?: string }>();
  const { data: conversations = [], isLoading, isError, refetch } = useConversations();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep in touch about pets and applications.
        </p>
      </header>

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-[20rem_minmax(0,1fr)]">
        <aside
          className={`${id ? "hidden md:block" : "block"} border-r border-gray-100`}
          aria-label="Conversations"
        >
          {isLoading && <p role="status" className="p-5">Loading conversations…</p>}
          {isError && (
            <div role="alert" className="p-5 text-sm text-red-700">
              <p>Conversations could not be loaded.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}
          {!isLoading && !isError && conversations.length === 0 && (
            <div className="p-6 text-center">
              <MessageCircle className="mx-auto text-gray-400" aria-hidden="true" />
              <p className="mt-3 font-semibold text-gray-900">No conversations yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Browse available pets to find your next conversation.
              </p>
              <Link
                to="/listings"
                className="mt-4 inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Browse pets
              </Link>
            </div>
          )}
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === id}
            />
          ))}
        </aside>

        <div className={`${id ? "block" : "hidden md:flex"} min-w-0`}>
          {id ? (
            <ConversationPanel conversationId={id} />
          ) : (
            <div className="hidden flex-1 items-center justify-center p-8 text-sm text-gray-500 md:flex">
              Select a conversation to view its messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
