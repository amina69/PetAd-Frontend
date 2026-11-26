/**
 * In-memory composer drafts, keyed by conversation. Module-level on purpose:
 * drafts survive switching threads (the composer remounts) but not a reload,
 * so message text never touches persistent storage.
 */
export interface Draft {
  text: string;
  files: File[];
}

const drafts = new Map<string, Draft>();

export function getDraft(conversationId: string): Draft {
  return drafts.get(conversationId) ?? { text: "", files: [] };
}

export function setDraft(conversationId: string, draft: Draft): void {
  if (draft.text === "" && draft.files.length === 0) {
    drafts.delete(conversationId);
    return;
  }
  drafts.set(conversationId, draft);
}

export function clearDraft(conversationId: string): void {
  drafts.delete(conversationId);
}

/** Test helper. */
export function clearAllDrafts(): void {
  drafts.clear();
}
