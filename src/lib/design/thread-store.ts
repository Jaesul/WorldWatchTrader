/**
 * Module-level message store for the design sandbox.
 * Persists across client-side navigations within a session (no hard refresh).
 * Keyed by thread ID (e.g. "seller-alexkim").
 */

export interface ThreadMessage {
  id: string;
  from: 'me' | 'seller';
  text?: string;
  sentAt: string;
  listing?: {
    id: string;
    model: string;
    price: string;
    active: boolean;
  };
}

const store = new Map<string, ThreadMessage[]>();

export function getMessages(threadId: string): ThreadMessage[] {
  return store.get(threadId) ?? [];
}

export function addMessage(threadId: string, msg: ThreadMessage): void {
  const existing = store.get(threadId) ?? [];
  store.set(threadId, [...existing, msg]);
}

/** Returns true if this exact listing ID is already referenced in the thread. */
export function hasListingRef(threadId: string, listingId: string): boolean {
  const msgs = store.get(threadId) ?? [];
  return msgs.some((m) => m.listing?.id === listingId);
}

export function getLastMessage(threadId: string): ThreadMessage | undefined {
  const msgs = store.get(threadId) ?? [];
  return msgs[msgs.length - 1];
}

export function getAllThreadIds(): string[] {
  return Array.from(store.keys());
}
