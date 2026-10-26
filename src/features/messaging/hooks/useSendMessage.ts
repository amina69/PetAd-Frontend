import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService, type SendMessageInput } from "../api/messageService";
import { applyMessageToConversations, findMessage, removeMessage, upsertMessage, type MessagesCache } from "../messageCache";
import type { Conversation, Message, MessageAttachment } from "../types/message";
import { isImageFile } from "../uploadRules";
import { useMessagingUser } from "./useMessagingUser";
import { messageKeys } from "./useMessages";

interface Outbox {
  conversationId: string;
  input: SendMessageInput;
  objectUrls: string[];
}

/**
 * Sends that haven't succeeded yet, by clientId. Module-level so Retry still
 * works after the user switches threads and comes back.
 */
const outbox = new Map<string, Outbox>();

function newClientId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function revoke(entry: Outbox | undefined): void {
  if (!entry || typeof URL.revokeObjectURL !== "function") return;
  entry.objectUrls.forEach((url) => URL.revokeObjectURL(url));
}

function buildAttachments(files: File[], objectUrls: string[]): MessageAttachment[] {
  return files.map((file, index) => {
    let url: string | undefined;
    if (isImageFile(file) && typeof URL.createObjectURL === "function") {
      url = URL.createObjectURL(file);
      objectUrls.push(url);
    }
    return { id: `tmp-att-${index}`, fileName: file.name, mimeType: file.type, size: file.size, url };
  });
}

export interface SendArgs {
  body: string;
  files?: File[];
}

/**
 * Optimistic send.
 *
 * - `send()` puts a temp message (`status: "sending"`) in the thread instantly.
 * - Success replaces it with the server message (`sent`); failure flips it to
 *   `failed`, where the UI offers `retry` / `remove`.
 * - Every attempt carries the same `clientId`, and the cache collapses copies
 *   by `clientId`, so a retry (or a socket echo racing the HTTP response)
 *   never duplicates the message.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const user = useMessagingUser();
  const threadKey = messageKeys.thread(conversationId);

  const patchThread = useCallback(
    (update: (data: MessagesCache | undefined) => MessagesCache | undefined) => {
      queryClient.setQueryData<MessagesCache>(threadKey, update);
    },
    [queryClient, threadKey],
  );

  const mutation = useMutation<Message, Error, SendMessageInput>({
    mutationFn: (input) => messageService.sendMessage(conversationId, input),

    onSuccess: (message, input) => {
      const sent: Message = { ...message, clientId: input.clientId, status: "sent" };
      const cached = queryClient.getQueryData<MessagesCache>(threadKey);
      if (cached) patchThread((data) => upsertMessage(data, sent));
      else void queryClient.invalidateQueries({ queryKey: threadKey });

      queryClient.setQueryData<Conversation[]>(messageKeys.conversations, (list) =>
        applyMessageToConversations(list, sent, false),
      );
      revoke(outbox.get(input.clientId));
      outbox.delete(input.clientId);
    },

    onError: (_error, input) => {
      patchThread((data) => {
        const existing = findMessage(data, input.clientId);
        return existing ? upsertMessage(data, { ...existing, status: "failed" }) : data;
      });
    },
  });

  const dispatch = useCallback(
    (input: SendMessageInput) => {
      patchThread((data) => {
        const existing = findMessage(data, input.clientId);
        if (existing) return upsertMessage(data, { ...existing, status: "sending" });

        const entry = outbox.get(input.clientId);
        const objectUrls = entry?.objectUrls ?? [];
        const temp: Message = {
          id: `tmp-${input.clientId}`,
          clientId: input.clientId,
          conversationId,
          senderId: user?.id ?? "me",
          senderName: user?.fullName ?? "You",
          body: input.body,
          attachments: buildAttachments(input.files ?? [], objectUrls),
          createdAt: new Date().toISOString(),
          status: "sending",
        };
        return upsertMessage(data, temp);
      });
      mutation.mutate(input);
    },
    [conversationId, mutation, patchThread, user],
  );

  const send = useCallback(
    ({ body, files }: SendArgs): string => {
      const input: SendMessageInput = { body, files, clientId: newClientId() };
      outbox.set(input.clientId, { conversationId, input, objectUrls: [] });
      dispatch(input);
      return input.clientId;
    },
    [conversationId, dispatch],
  );

  /** Re-sends a failed message with its original clientId. No-op for unknown ids. */
  const retry = useCallback(
    (clientId: string) => {
      const entry = outbox.get(clientId);
      if (entry) dispatch(entry.input);
    },
    [dispatch],
  );

  /** Discards a failed message. */
  const remove = useCallback(
    (clientId: string) => {
      revoke(outbox.get(clientId));
      outbox.delete(clientId);
      patchThread((data) => removeMessage(data, clientId));
    },
    [patchThread],
  );

  return { send, retry, remove, isSending: mutation.isPending };
}

/** Test helper. */
export function clearOutbox(): void {
  outbox.clear();
}
