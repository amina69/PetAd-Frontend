import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { useSendMessage } from "../hooks/useSendMessage";
import { clearDraft, getDraft, setDraft } from "../draftStore";
import { acceptAttribute, UPLOAD_RULES, validateFiles } from "../uploadRules";
import { AttachmentChips } from "./AttachmentChips";

interface MessageComposerProps {
  conversationId: string;
  disabled?: boolean;
}

/**
 * Composer for one conversation. Enter sends, Shift+Enter inserts a newline.
 * Drafts (text and queued attachments) are kept in memory per conversation, so
 * switching threads and coming back restores them.
 */
export function MessageComposer({ conversationId, disabled }: MessageComposerProps) {
  // Remount per conversation so state initialises from that conversation's draft.
  return <ComposerInner key={conversationId} conversationId={conversationId} disabled={disabled} />;
}

function ComposerInner({ conversationId, disabled }: MessageComposerProps) {
  const initial = getDraft(conversationId);
  const [text, setText] = useState(initial.text);
  const [files, setFiles] = useState<File[]>(initial.files);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const { send } = useSendMessage(conversationId);

  const canSend = !disabled && (text.trim().length > 0 || files.length > 0);
  const maxFiles = UPLOAD_RULES.message.maxFiles;

  const update = (nextText: string, nextFiles: File[]) => {
    setText(nextText);
    setFiles(nextFiles);
    setDraft(conversationId, { text: nextText, files: nextFiles });
  };

  const submit = () => {
    if (!canSend) return;
    send({ body: text.trim(), files: files.length > 0 ? files : undefined });
    setText("");
    setFiles([]);
    setErrors([]);
    clearDraft(conversationId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (incoming.length === 0) return;

    const { accepted, errors: problems } = validateFiles("message", files, incoming);
    setErrors(problems);
    if (accepted.length > 0) update(text, [...files, ...accepted]);
  };

  return (
    <form
      className="flex flex-col gap-2 border-t border-gray-200 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <AttachmentChips files={files} onRemove={(index) => update(text, files.filter((_, i) => i !== index))} />

      {errors.length > 0 && (
        <ul role="alert" className="space-y-0.5 text-xs text-red-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={acceptAttribute("message")}
          onChange={handleFiles}
          data-testid="attachment-input"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled || files.length >= maxFiles}
          aria-label="Attach files"
          title={files.length >= maxFiles ? `Up to ${maxFiles} attachments per message` : "Attach images or PDFs"}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Paperclip size={20} aria-hidden="true" />
        </button>

        <textarea
          value={text}
          onChange={(event) => update(event.target.value, files)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          aria-label="Message"
          placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
          className="max-h-32 min-h-[40px] flex-1 resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D162B]"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="rounded-full bg-[#0D162B] p-2.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
