import { useParams } from "react-router-dom";
import { ConversationList } from "../features/messaging/components/ConversationList";
import { MessageComposer } from "../features/messaging/components/MessageComposer";
import { MessageThread } from "../features/messaging/components/MessageThread";
import { useMessageSocketSync } from "../features/messaging/hooks/useMessageSocketSync";

/** /messages and /messages/:conversationId */
export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  useMessageSocketSync({ activeConversationId: conversationId });

  return (
    <div className="mx-auto grid h-[calc(100vh-180px)] min-h-[420px] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid-cols-[320px_1fr]">
      <aside className={`overflow-y-auto border-r border-gray-100 ${conversationId ? "hidden md:block" : ""}`}>
        <h1 className="border-b border-gray-100 px-4 py-3 text-lg font-bold text-[#0D162B]">Messages</h1>
        <ConversationList />
      </aside>

      <section className={`flex min-h-0 flex-col ${conversationId ? "" : "hidden md:flex"}`}>
        {conversationId ? (
          <>
            <div className="min-h-0 flex-1">
              <MessageThread conversationId={conversationId} />
            </div>
            <MessageComposer conversationId={conversationId} />
          </>
        ) : (
          <p className="m-auto text-sm text-gray-500">Select a conversation to start messaging.</p>
        )}
      </section>
    </div>
  );
}
