import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, FileText } from "lucide-react";
import type { Message, MessageAttachment } from "../types/message";
import { messageService } from "../api/messageService";
import { formatBytes, isImageFile } from "../uploadRules";
import { AttachmentPreview } from "./AttachmentPreview";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  /** Ref callback used to observe unread incoming messages. */
  observeRef?: (element: HTMLElement | null) => void | (() => void);
  onRetry?: (clientId: string) => void;
  onDelete?: (clientId: string) => void;
}

function FileCard({ messageId, attachment }: { messageId: string; attachment: MessageAttachment }) {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = messageId.startsWith("tmp-");

  const download = async () => {
    setBusy(true);
    setError(false);
    try {
      // Short-lived URL: fetched at click time, never stored.
      const { url } = await messageService.getAttachmentUrl(messageId, attachment.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-900">
      <FileText size={20} className="shrink-0 text-gray-500" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{attachment.fileName}</span>
        <span className="block text-[11px] text-gray-500">{formatBytes(attachment.size)}</span>
        {error && (
          <span role="alert" className="block text-[11px] text-red-600">
            Couldn't get the download link. Try again.
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={download}
        disabled={busy || pending}
        aria-label={`Download ${attachment.fileName}`}
        className="rounded-full p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
      >
        <Download size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function MessageBubble({ message, isOwn, observeRef, onRetry, onDelete }: MessageBubbleProps) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const failed = message.status === "failed";
  const sending = message.status === "sending";
  const sender = isOwn ? "you" : message.senderName;
  const clientId = message.clientId ?? message.id;

  return (
    <div
      ref={observeRef}
      data-message-id={message.id}
      data-testid="message"
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
    >
      {!isOwn && <span className="mb-0.5 px-1 text-[11px] font-medium text-gray-500">{message.senderName}</span>}

      <div
        className={`max-w-[80%] space-y-2 rounded-2xl px-3 py-2 text-sm ${
          isOwn ? "bg-[#0D162B] text-white" : "bg-gray-100 text-gray-900"
        } ${sending ? "opacity-70" : ""} ${failed ? "ring-1 ring-red-400" : ""}`}
      >
        {message.attachments.map((attachment) =>
          isImageFile({ type: attachment.mimeType, name: attachment.fileName }) && attachment.url ? (
            <button
              key={attachment.id}
              type="button"
              onClick={() => setPreviewing(attachment.url!)}
              aria-label={`Preview image ${attachment.fileName}`}
              className="block overflow-hidden rounded-lg"
            >
              <img
                src={attachment.url}
                alt={`Image sent by ${sender}`}
                loading="lazy"
                className="max-h-60 max-w-full object-cover"
              />
            </button>
          ) : (
            <FileCard key={attachment.id} messageId={message.id} attachment={attachment} />
          ),
        )}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
      </div>

      <div className="mt-0.5 flex items-center gap-2 px-1 text-[11px] text-gray-500">
        {sending ? (
          <span>Sending…</span>
        ) : failed ? (
          <>
            <span role="status" className="text-red-600">
              Failed to send
            </span>
            <button type="button" onClick={() => onRetry?.(clientId)} className="font-medium text-[#E84D2A] hover:underline">
              Retry
            </button>
            <button type="button" onClick={() => onDelete?.(clientId)} className="font-medium text-gray-600 hover:underline">
              Delete
            </button>
          </>
        ) : (
          <time dateTime={message.createdAt}>{format(parseISO(message.createdAt), "HH:mm")}</time>
        )}
        {isOwn && !sending && !failed && message.readAt && <span>Read</span>}
      </div>

      {previewing && (
        <AttachmentPreview src={previewing} alt={`Image sent by ${sender}`} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
