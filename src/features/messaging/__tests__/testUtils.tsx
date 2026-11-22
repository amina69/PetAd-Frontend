import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { Message } from "../types/message";

export const ME = { id: "user-me", fullName: "Me Myself" };

export function signIn(): void {
  localStorage.setItem("petad_user", JSON.stringify(ME));
}

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}

let counter = 0;
export function msg(overrides: Partial<Message> = {}): Message {
  counter += 1;
  return {
    id: `m${counter}`,
    conversationId: "c1",
    senderId: "user-other",
    senderName: "Jane",
    body: `body ${counter}`,
    attachments: [],
    createdAt: new Date(2026, 0, 10, 9, counter).toISOString(),
    readAt: null,
    ...overrides,
  };
}

export function file(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}
