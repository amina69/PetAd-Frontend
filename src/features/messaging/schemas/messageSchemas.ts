import { z } from "zod";

const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  url: z.string().url(),
  contentType: z.string().optional(),
});

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(2000, "Message must be 2000 characters or fewer");

const apiMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  body: z.string(),
  attachments: z.array(attachmentSchema).default([]),
  sentAt: z.string(),
  status: z.literal("sent").optional(),
});

export const messageSchema = apiMessageSchema.transform((message) => ({
  ...message,
  status: "sent" as const,
}));

export const conversationSchema = z.object({
  id: z.string(),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      avatarUrl: z.string().optional(),
    }),
  ),
  petId: z.string(),
  lastMessage: messageSchema,
  unreadCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export const conversationListSchema = z.union([
  z.array(conversationSchema),
  z.object({ items: z.array(conversationSchema) }).transform(({ items }) => items),
]);

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable().optional(),
});
