import { designDmReplyHref } from '@/lib/design/dm-reply';

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
  /** User-attached photos (data URLs) — design sandbox only; not persisted to disk. */
  images?: string[];
  listing?: {
    id: string;
    model: string;
    price: string;
    active: boolean;
    /** True when this listing belongs to the current user (inbound inquiry). */
    isMyListing?: boolean;
  };
}

const SEED: Record<string, ThreadMessage[]> = {
  'seller-alexkim': [
    {
      id: 'ak-1',
      from: 'me',
      sentAt: '9:14 AM',
      listing: { id: '1', model: 'Rolex Submariner 126610LN', price: '$12,500', active: true },
      text: 'Hi Alex — still have this Sub available?',
    },
    {
      id: 'ak-2',
      from: 'seller',
      sentAt: '9:22 AM',
      text: 'Hey! Yes, still available. Just had it serviced last month.',
    },
    {
      id: 'ak-3',
      from: 'me',
      sentAt: '9:25 AM',
      text: 'Nice — any flexibility on price? Would $12k work?',
    },
    {
      id: 'ak-4',
      from: 'seller',
      sentAt: '9:31 AM',
      text: 'I can do $12,200 — that\'s my firm. Full set really does command a premium.',
    },
    {
      id: 'ak-5',
      from: 'me',
      sentAt: '9:33 AM',
      text: 'Makes sense. Can you shoot me more photos of the clasp and bracelet end-links?',
    },
    {
      id: 'ak-6',
      from: 'seller',
      sentAt: '9:41 AM',
      text: 'On it — sending now. Crystal and clasp are both flawless, you\'ll see.',
    },
  ],
  'seller-harbortime': [
    {
      id: 'ht-0a',
      from: 'seller',
      sentAt: '1:47 PM',
      listing: { id: 'seed-2', model: 'Tudor Black Bay 58 Navy', price: '$3,200', active: true, isMyListing: true },
      text: 'Hi — really love this Tudor. Is it still available?',
    },
    {
      id: 'ht-0b',
      from: 'me',
      sentAt: '1:55 PM',
      text: 'Hey! Yes, still available. Just had the bracelet cleaned.',
    },
    {
      id: 'ht-0c',
      from: 'seller',
      sentAt: '2:01 PM',
      text: 'Great. Any flexibility on $3,200? Looking to move quickly.',
    },
    {
      id: 'ht-1',
      from: 'me',
      sentAt: '2:05 PM',
      listing: { id: '2', model: 'Omega Speedmaster Professional Moonwatch', price: '$5,800', active: true },
      text: 'Best I can do is $3,100. Also — I\'ve been eyeing your Speedmaster. Still available?',
    },
    {
      id: 'ht-2',
      from: 'seller',
      sentAt: '2:18 PM',
      text: 'Yes, still here! Ready to ship same day. Service records from 2023 included.',
    },
    {
      id: 'ht-3',
      from: 'me',
      sentAt: '2:20 PM',
      text: 'Good to know. Does the bracelet have any stretch?',
    },
    {
      id: 'ht-4',
      from: 'seller',
      sentAt: '2:27 PM',
      text: 'Minimal — maybe one link on one side. Overall very clean for its age.',
    },
    {
      id: 'ht-5',
      from: 'me',
      sentAt: '2:29 PM',
      text: 'Alright, I\'m interested. What payment methods do you accept?',
    },
    {
      id: 'ht-6',
      from: 'seller',
      sentAt: '2:35 PM',
      text: 'Wire transfer or PayPal G&S. Happy to hold it 24 hrs with a deposit.',
    },
  ],
  'seller-marcor': [
    {
      id: 'mr-1',
      from: 'me',
      sentAt: '11:02 AM',
      listing: { id: '3', model: 'Patek Philippe Nautilus 5711/1A', price: '$120,000', active: true },
      text: 'Interested in the 5711. Can you verify provenance?',
    },
    {
      id: 'mr-2',
      from: 'seller',
      sentAt: '11:20 AM',
      text: 'Sure. I have the original purchase receipt from an AD in Geneva, dated 2019.',
    },
    {
      id: 'mr-3',
      from: 'me',
      sentAt: '11:23 AM',
      text: 'Box only though — no papers at all?',
    },
    {
      id: 'mr-4',
      from: 'seller',
      sentAt: '11:35 AM',
      text: 'Correct. Previous owner misplaced the papers before I acquired it. Receipt more than covers it.',
    },
    {
      id: 'mr-5',
      from: 'me',
      sentAt: '11:37 AM',
      text: 'Understood. Would you be open to an in-person inspection in NYC?',
    },
    {
      id: 'mr-6',
      from: 'seller',
      sentAt: '11:50 AM',
      text: 'Absolutely — I\'m in Manhattan. We can arrange something next week, just let me know.',
    },
  ],
};

const store = new Map<string, ThreadMessage[]>(Object.entries(SEED));

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

/** True if the current user already attached this listing in an outbound message. */
export function hasBuyerAttachedListing(
  threadId: string,
  listingId: string,
): boolean {
  const msgs = store.get(threadId) ?? [];
  return msgs.some(
    (m) => m.from === 'me' && m.listing?.id === listingId,
  );
}

/** @deprecated sellerHandle ignored — use {@link designDmReplyHref} or `/design/messages/start?listingId=` */
export function replyToSellerListingHref(_sellerHandle: string, listingId: string): string {
  return designDmReplyHref(listingId);
}

export function getLastMessage(threadId: string): ThreadMessage | undefined {
  const msgs = store.get(threadId) ?? [];
  return msgs[msgs.length - 1];
}

export function getAllThreadIds(): string[] {
  return Array.from(store.keys());
}

/** Returns IDs of threads where someone has messaged about one of the current user's listings. */
export function getThreadIdsForMyListing(listingId: string): string[] {
  const result: string[] = [];
  for (const [threadId, msgs] of store.entries()) {
    if (msgs.some((m) => m.listing?.id === listingId && m.listing?.isMyListing)) {
      result.push(threadId);
    }
  }
  return result;
}

/**
 * Returns whether a thread has inbound activity (seller sent a listing that
 * belongs to the current user) and/or outbound activity (current user sent a
 * listing that belongs to someone else).
 */
export function classifyThread(threadId: string): { inbound: boolean; outbound: boolean } {
  const msgs = store.get(threadId) ?? [];
  const inbound = msgs.some((m) => m.from === 'seller' && m.listing != null);
  const outbound = msgs.some((m) => m.from === 'me' && m.listing != null);
  return { inbound, outbound };
}

/**
 * True when the other party has attached a listing card for one of the current
 * user's listings (inbound inquiry). Used to gate thread actions like "mark sold".
 */
export function threadHasCounterpartySharedMyListing(
  messages: ThreadMessage[],
  myListingIds: readonly string[],
): boolean {
  const mine = new Set(myListingIds);
  return messages.some(
    (m) =>
      m.from === 'seller' &&
      m.listing != null &&
      (m.listing.isMyListing === true || mine.has(m.listing.id)),
  );
}
