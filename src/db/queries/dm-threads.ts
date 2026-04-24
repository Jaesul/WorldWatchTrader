import { and, asc, desc, eq, gt, inArray, or } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { getDb } from '@/db';
import { dmMessages, dmThreads, listingPhotos, listings, users } from '@/db/schema';

export type DmThreadError = 'listing_not_found' | 'cannot_message_self' | 'thread_not_found' | 'forbidden';

/** Canonical storage: `buyer_id` &lt; `seller_id` (lexicographic string order). */
export function canonicalParticipantIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Stored on `dm_messages.listing_snapshot` and returned to clients. */
export type DmListingSnapshot = {
  listingId: string;
  title: string;
  priceUsd: number;
  status: string;
  imageUrl: string | null;
};

export async function buildListingSnapshot(listingId: string): Promise<DmListingSnapshot | null> {
  const db = getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return null;
  const [photo] = await db
    .select({ url: listingPhotos.url })
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(asc(listingPhotos.sortOrder))
    .limit(1);
  return {
    listingId: listing.id,
    title: listing.title,
    priceUsd: listing.priceUsd,
    status: listing.status,
    imageUrl: photo?.url ?? null,
  };
}

/**
 * Finds a DM row for two users. Rows are usually stored with lex-low → `buyer_id`,
 * lex-high → `seller_id`, but older rows may use the reverse; we accept either.
 */
async function selectThreadForParticipantPair(low: string, high: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(dmThreads)
    .where(
      or(
        and(eq(dmThreads.buyerId, low), eq(dmThreads.sellerId, high)),
        and(eq(dmThreads.buyerId, high), eq(dmThreads.sellerId, low)),
      ),
    );

  return (
    rows.find((t) => t.buyerId === low && t.sellerId === high) ?? rows[0] ?? null
  );
}

/** Opens or returns the single thread between the viewer and the listing's seller. */
export async function getOrCreateThread(initiatorId: string, listingId: string) {
  const db = getDb();
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return { ok: false as const, error: 'listing_not_found' satisfies DmThreadError };
  if (listing.sellerId === initiatorId) {
    return { ok: false as const, error: 'cannot_message_self' satisfies DmThreadError };
  }
  const [low, high] = canonicalParticipantIds(initiatorId, listing.sellerId);
  const now = new Date();

  const existing = await selectThreadForParticipantPair(low, high);
  if (existing) return { ok: true as const, thread: existing };

  await db
    .insert(dmThreads)
    .values({
      listingId: null,
      buyerId: low,
      sellerId: high,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [dmThreads.buyerId, dmThreads.sellerId],
    });

  const thread = await selectThreadForParticipantPair(low, high);
  if (!thread) return { ok: false as const, error: 'thread_not_found' satisfies DmThreadError };
  return { ok: true as const, thread };
}

export async function assertThreadParticipant(threadId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: dmThreads.id })
    .from(dmThreads)
    .where(
      and(
        eq(dmThreads.id, threadId),
        or(eq(dmThreads.buyerId, userId), eq(dmThreads.sellerId, userId)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getThreadById(threadId: string) {
  const db = getDb();
  const [row] = await db.select().from(dmThreads).where(eq(dmThreads.id, threadId)).limit(1);
  return row ?? null;
}

export async function getDmThreadDetailForViewer(
  threadId: string,
  viewerId: string,
  opts?: { composeListingId?: string | null },
) {
  const thread = await getThreadById(threadId);
  if (!thread) return null;
  if (thread.buyerId !== viewerId && thread.sellerId !== viewerId) return null;
  const counterpartId = thread.buyerId === viewerId ? thread.sellerId : thread.buyerId;
  const db = getDb();

  let listingIdToLoad = thread.listingId;
  const composeId = opts?.composeListingId?.trim() ?? '';
  if (!listingIdToLoad && composeId) {
    const [composeListing] = await db.select().from(listings).where(eq(listings.id, composeId)).limit(1);
    if (
      composeListing &&
      (composeListing.sellerId === counterpartId || composeListing.sellerId === viewerId)
    ) {
      listingIdToLoad = composeListing.id;
    }
  }

  const counterpartRows = await db.select().from(users).where(eq(users.id, counterpartId)).limit(1);
  const counterpart = counterpartRows[0];
  if (!counterpart) return null;

  if (!listingIdToLoad) {
    return {
      thread,
      listing: null as (typeof listings.$inferSelect) | null,
      listingImageUrl: null as string | null,
      counterpart,
    };
  }

  const [listingRows, coverRows] = await Promise.all([
    db.select().from(listings).where(eq(listings.id, listingIdToLoad)).limit(1),
    db
      .select({ url: listingPhotos.url })
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, listingIdToLoad))
      .orderBy(asc(listingPhotos.sortOrder))
      .limit(1),
  ]);
  const listing = listingRows[0];
  if (!listing) {
    return {
      thread,
      listing: null,
      listingImageUrl: null,
      counterpart,
    };
  }

  return {
    thread,
    listing,
    listingImageUrl: coverRows[0]?.url ?? null,
    counterpart,
  };
}

export type InboxRow = {
  thread: typeof dmThreads.$inferSelect;
  listing: (typeof listings.$inferSelect) | null;
  counterpart: typeof users.$inferSelect;
  lastMessageBody: string | null;
  lastMessageSenderId: string | null;
};

export async function listThreadsForUser(userId: string): Promise<InboxRow[]> {
  const db = getDb();
  const threadRows = await db
    .select({ thread: dmThreads, listing: listings })
    .from(dmThreads)
    .leftJoin(listings, eq(dmThreads.listingId, listings.id))
    .where(or(eq(dmThreads.buyerId, userId), eq(dmThreads.sellerId, userId)))
    .orderBy(desc(dmThreads.lastMessageAt));

  if (threadRows.length === 0) return [];

  const counterpartIds = threadRows.map((r) =>
    r.thread.buyerId === userId ? r.thread.sellerId : r.thread.buyerId,
  );
  const counterpartRows = await db.select().from(users).where(inArray(users.id, counterpartIds));
  const counterpartById = new Map(counterpartRows.map((u) => [u.id, u]));

  const threadIds = threadRows.map((r) => r.thread.id);
  const lastByThread = new Map<string, { preview: string | null; senderId: string | null }>();
  if (threadIds.length > 0) {
    const lastPerThread = await Promise.all(
      threadIds.map(async (tid) => {
        const [m] = await db
          .select({
            body: dmMessages.body,
            listingSnapshot: dmMessages.listingSnapshot,
            senderId: dmMessages.senderId,
          })
          .from(dmMessages)
          .where(eq(dmMessages.threadId, tid))
          .orderBy(desc(dmMessages.createdAt))
          .limit(1);
        const text = m?.body?.trim() ?? '';
        const preview =
          text.length > 0 ? text : m?.listingSnapshot != null ? 'Listing' : null;
        return { tid, preview, senderId: m?.senderId ?? null };
      }),
    );
    for (const { tid, preview, senderId } of lastPerThread) {
      lastByThread.set(tid, { preview, senderId });
    }
  }

  return threadRows.map((r) => {
    const cid = r.thread.buyerId === userId ? r.thread.sellerId : r.thread.buyerId;
    const counterpart = counterpartById.get(cid);
    if (!counterpart) {
      throw new Error(`Missing counterpart user ${cid} for thread ${r.thread.id}`);
    }
    const last = lastByThread.get(r.thread.id);
    return {
      thread: r.thread,
      listing: r.listing ?? null,
      counterpart,
      lastMessageBody: last?.preview ?? null,
      lastMessageSenderId: last?.senderId ?? null,
    };
  });
}

export async function getLatestMessageCreatedAt(threadId: string): Promise<Date | null> {
  const db = getDb();
  const [row] = await db
    .select({ createdAt: dmMessages.createdAt })
    .from(dmMessages)
    .where(eq(dmMessages.threadId, threadId))
    .orderBy(desc(dmMessages.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}

export async function listMessages(
  threadId: string,
  opts: { afterCreatedAt?: Date; limit?: number } = {},
) {
  const db = getDb();
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 200);
  const conditions = [eq(dmMessages.threadId, threadId)];
  if (opts.afterCreatedAt) {
    conditions.push(gt(dmMessages.createdAt, opts.afterCreatedAt));
  }
  return db
    .select()
    .from(dmMessages)
    .where(and(...conditions))
    .orderBy(dmMessages.createdAt)
    .limit(limit);
}

export async function insertMessage(input: {
  threadId: string;
  senderId: string;
  body: string;
  listingSnapshot?: DmListingSnapshot | null;
}) {
  const trimmed = input.body.trim();
  if (!trimmed && !input.listingSnapshot) return null;

  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [thread] = await tx.select().from(dmThreads).where(eq(dmThreads.id, input.threadId)).limit(1);
    if (!thread) return null;
    if (thread.buyerId !== input.senderId && thread.sellerId !== input.senderId) return null;

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: input.threadId,
        senderId: input.senderId,
        body: trimmed,
        listingSnapshot: input.listingSnapshot ?? null,
        createdAt: now,
      })
      .returning();

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, input.threadId));

    return msg ?? null;
  });
}

export type DmMessageRow = InferSelectModel<typeof dmMessages>;

export function messageToApi(m: DmMessageRow) {
  const snap = m.listingSnapshot;
  const listingSnapshot: DmListingSnapshot | null =
    snap != null && typeof snap === 'object' && 'listingId' in snap
      ? (snap as DmListingSnapshot)
      : null;
  return {
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    listingSnapshot,
  };
}
