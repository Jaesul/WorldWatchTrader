import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dmMessages,
  dmThreads,
  dmTransactionRequests,
  listingDeals,
  listingPhotos,
  listings,
  users,
  type DmTransactionRequestStatus,
} from '@/db/schema';
import type { DmListingSnapshot } from '@/db/queries/dm-threads';

export type DmTxRequestError =
  | 'thread_not_found'
  | 'listing_not_found'
  | 'not_seller'
  | 'not_participant'
  | 'not_recipient'
  | 'duplicate_pending'
  | 'request_not_found'
  | 'invalid_status'
  | 'already_resolved'
  | 'invalid_price'
  | 'invalid_description'
  | 'invalid_reason'
  | 'invalid_tx_hash'
  | 'invalid_user_op_hash';

export type DmTxRequestSnapshot = {
  requestId: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  listing: DmListingSnapshot;
  priceUsd: number;
  description: string;
  status: DmTransactionRequestStatus;
  declineReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const MAX_DESCRIPTION_LEN = 1000;
const MAX_REASON_LEN = 500;
const WORLD_CHAIN_ID = 480;
const WORLD_CHAIN_NAME = 'World Chain';

function normaliseText(s: string | null | undefined, max: number): string {
  if (!s) return '';
  const trimmed = s.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function priceIsValid(p: number): boolean {
  return Number.isInteger(p) && p >= 0 && p <= 10_000_000;
}

function toSnapshot(
  req: typeof dmTransactionRequests.$inferSelect,
  listing: DmListingSnapshot,
): DmTxRequestSnapshot {
  return {
    requestId: req.id,
    threadId: req.threadId,
    senderId: req.senderId,
    recipientId: req.recipientId,
    listing,
    priceUsd: req.priceUsd,
    description: req.description,
    status: req.status as DmTransactionRequestStatus,
    declineReason: req.declineReason,
    resolvedAt: req.resolvedAt ? req.resolvedAt.toISOString() : null,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
  };
}

async function buildListingSnapshotRow(
  listingId: string,
  priceOverrideUsd: number | null,
): Promise<DmListingSnapshot | null> {
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
    priceUsd: priceOverrideUsd ?? listing.priceUsd,
    status: listing.status,
    imageUrl: photo?.url ?? null,
  };
}

/**
 * Creates a transaction request inside an existing thread. Sender must own the
 * listing and be one of the thread participants. A matching `dm_messages` row
 * is inserted in the same transaction so the request appears in chat.
 */
export async function createTransactionRequest(input: {
  threadId: string;
  listingId: string;
  senderId: string;
  priceUsd: number;
  description: string;
}): Promise<
  | { ok: true; request: DmTxRequestSnapshot; messageId: string }
  | { ok: false; error: DmTxRequestError }
> {
  const description = normaliseText(input.description, MAX_DESCRIPTION_LEN);
  if (!priceIsValid(input.priceUsd)) {
    return { ok: false, error: 'invalid_price' };
  }
  if (description.length > MAX_DESCRIPTION_LEN) {
    return { ok: false, error: 'invalid_description' };
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [thread] = await tx
      .select()
      .from(dmThreads)
      .where(eq(dmThreads.id, input.threadId))
      .limit(1);
    if (!thread) return { ok: false as const, error: 'thread_not_found' as const };
    if (thread.buyerId !== input.senderId && thread.sellerId !== input.senderId) {
      return { ok: false as const, error: 'not_participant' as const };
    }

    const [listing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, input.listingId))
      .limit(1);
    if (!listing) return { ok: false as const, error: 'listing_not_found' as const };
    if (listing.sellerId !== input.senderId) {
      return { ok: false as const, error: 'not_seller' as const };
    }

    const recipientId =
      thread.buyerId === input.senderId ? thread.sellerId : thread.buyerId;

    const existingPending = await tx
      .select({ id: dmTransactionRequests.id })
      .from(dmTransactionRequests)
      .where(
        and(
          eq(dmTransactionRequests.threadId, input.threadId),
          eq(dmTransactionRequests.listingId, input.listingId),
          eq(dmTransactionRequests.status, 'pending'),
        ),
      )
      .limit(1);
    if (existingPending[0]) {
      return { ok: false as const, error: 'duplicate_pending' as const };
    }

    const [reqRow] = await tx
      .insert(dmTransactionRequests)
      .values({
        threadId: input.threadId,
        listingId: input.listingId,
        senderId: input.senderId,
        recipientId,
        priceUsd: input.priceUsd,
        description,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!reqRow) throw new Error('Failed to create transaction request');

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: input.threadId,
        senderId: input.senderId,
        body: '',
        txRequestId: reqRow.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to insert tx request chat message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, input.threadId));

    const snap = await buildListingSnapshotRow(input.listingId, input.priceUsd);
    if (!snap) throw new Error('Listing vanished mid-transaction');

    return {
      ok: true as const,
      request: toSnapshot(reqRow, snap),
      messageId: msg.id,
    };
  });
}

export type DmTxAcceptPreparePayload = {
  chainId: number;
  transactions: Array<{
    to: string;
    value: string;
  }>;
  settlement: {
    chainName: string;
    tokenSymbol: string;
    amountRaw: string;
    executedWith: 'minikit_send_transaction';
    fromAddress: string;
    toAddress: string;
  };
};

export async function prepareAcceptTransactionRequest(
  requestId: string,
  viewerId: string,
): Promise<
  | { ok: true; request: DmTxRequestSnapshot; payload: DmTxAcceptPreparePayload }
  | { ok: false; error: DmTxRequestError }
> {
  const db = getDb();
  const [reqRow] = await db
    .select()
    .from(dmTransactionRequests)
    .where(eq(dmTransactionRequests.id, requestId))
    .limit(1);
  if (!reqRow) return { ok: false as const, error: 'request_not_found' as const };
  if (reqRow.recipientId !== viewerId) {
    return { ok: false as const, error: 'not_recipient' as const };
  }
  if (reqRow.status !== 'pending') {
    return { ok: false as const, error: 'invalid_status' as const };
  }

  const [buyer] = await db.select().from(users).where(eq(users.id, reqRow.recipientId)).limit(1);
  const [seller] = await db.select().from(users).where(eq(users.id, reqRow.senderId)).limit(1);
  if (!buyer || !seller) {
    return { ok: false as const, error: 'not_participant' as const };
  }
  if (!buyer.walletAddress || !seller.walletAddress) {
    return { ok: false as const, error: 'not_participant' as const };
  }
  const [listing] = await db.select().from(listings).where(eq(listings.id, reqRow.listingId)).limit(1);
  if (!listing) return { ok: false as const, error: 'listing_not_found' as const };
  if (listing.sellerId !== reqRow.senderId) {
    return { ok: false as const, error: 'not_seller' as const };
  }

  const snap = await buildListingSnapshotRow(reqRow.listingId, reqRow.priceUsd);
  if (!snap) return { ok: false as const, error: 'listing_not_found' as const };

  const valueWei = BigInt(Math.max(reqRow.priceUsd, 1)).toString();
  return {
    ok: true as const,
    request: toSnapshot(reqRow, snap),
    payload: {
      chainId: WORLD_CHAIN_ID,
      transactions: [{ to: seller.walletAddress, value: `0x${BigInt(valueWei).toString(16)}` }],
      settlement: {
        chainName: WORLD_CHAIN_NAME,
        tokenSymbol: 'ETH',
        amountRaw: valueWei,
        executedWith: 'minikit_send_transaction',
        fromAddress: buyer.walletAddress,
        toAddress: seller.walletAddress,
      },
    },
  };
}

function isHexHash(value: string | null | undefined): value is string {
  return !!value && /^0x[0-9a-fA-F]{64}$/.test(value);
}

export async function finalizeAcceptedTransactionRequest(input: {
  requestId: string;
  viewerId: string;
  userOpHash: string;
  transactionHash: string | null;
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  amountRaw: string;
  fromAddress: string;
  toAddress: string;
}): Promise<
  | { ok: true; request: DmTxRequestSnapshot; messageId: string; dealId: string }
  | { ok: false; error: DmTxRequestError }
> {
  if (!isHexHash(input.userOpHash)) {
    return { ok: false, error: 'invalid_user_op_hash' };
  }
  if (input.transactionHash && !isHexHash(input.transactionHash)) {
    return { ok: false, error: 'invalid_tx_hash' };
  }
  const amountRaw = input.amountRaw.trim();
  if (!/^\d+$/.test(amountRaw)) {
    return { ok: false, error: 'invalid_price' };
  }

  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [reqRow] = await tx
      .select()
      .from(dmTransactionRequests)
      .where(eq(dmTransactionRequests.id, input.requestId))
      .limit(1);
    if (!reqRow) return { ok: false as const, error: 'request_not_found' as const };
    if (reqRow.recipientId !== input.viewerId) {
      return { ok: false as const, error: 'not_recipient' as const };
    }
    if (reqRow.status !== 'pending') {
      return { ok: false as const, error: 'already_resolved' as const };
    }

    const [updatedReq] = await tx
      .update(dmTransactionRequests)
      .set({ status: 'accepted', resolvedAt: now, updatedAt: now })
      .where(eq(dmTransactionRequests.id, input.requestId))
      .returning();
    if (!updatedReq) throw new Error('Failed to update request to accepted');

    const [deal] = await tx
      .insert(listingDeals)
      .values({
        listingId: reqRow.listingId,
        sellerId: reqRow.senderId,
        buyerId: reqRow.recipientId,
        status: 'confirmed',
        chainId: input.chainId,
        chainName: input.chainName,
        userOpHash: input.userOpHash,
        transactionHash: input.transactionHash,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        tokenSymbol: input.tokenSymbol,
        amountRaw,
        priceUsd: reqRow.priceUsd,
        executedWith: 'minikit_send_transaction',
        confirmedAt: now,
        updatedAt: now,
      })
      .returning();
    if (!deal) throw new Error('Failed to insert listing deal');

    await tx
      .update(listings)
      .set({ status: 'sold', updatedAt: now })
      .where(eq(listings.id, reqRow.listingId));

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: reqRow.threadId,
        senderId: reqRow.recipientId,
        body: '',
        txRequestId: reqRow.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to insert accept follow-up message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, reqRow.threadId));

    const snap = await buildListingSnapshotRow(reqRow.listingId, reqRow.priceUsd);
    if (!snap) throw new Error('Listing vanished mid-transaction');
    return {
      ok: true as const,
      request: toSnapshot(updatedReq, snap),
      messageId: msg.id,
      dealId: deal.id,
    };
  });
}

export async function declineTransactionRequest(
  requestId: string,
  viewerId: string,
  reason: string | null,
): Promise<
  | { ok: true; request: DmTxRequestSnapshot; messageId: string }
  | { ok: false; error: DmTxRequestError }
> {
  const cleanReason = normaliseText(reason ?? '', MAX_REASON_LEN);
  if (reason != null && cleanReason.length > MAX_REASON_LEN) {
    return { ok: false, error: 'invalid_reason' };
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [reqRow] = await tx
      .select()
      .from(dmTransactionRequests)
      .where(eq(dmTransactionRequests.id, requestId))
      .limit(1);
    if (!reqRow) return { ok: false as const, error: 'request_not_found' as const };
    if (reqRow.recipientId !== viewerId) {
      return { ok: false as const, error: 'not_recipient' as const };
    }
    if (reqRow.status !== 'pending') {
      return { ok: false as const, error: 'invalid_status' as const };
    }

    const [updatedReq] = await tx
      .update(dmTransactionRequests)
      .set({
        status: 'declined',
        declineReason: cleanReason.length > 0 ? cleanReason : null,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(eq(dmTransactionRequests.id, requestId))
      .returning();
    if (!updatedReq) throw new Error('Failed to update request to declined');

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: reqRow.threadId,
        senderId: reqRow.recipientId,
        body: '',
        txRequestId: reqRow.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to insert decline follow-up message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, reqRow.threadId));

    const snap = await buildListingSnapshotRow(reqRow.listingId, reqRow.priceUsd);
    if (!snap) throw new Error('Listing vanished mid-transaction');

    return {
      ok: true as const,
      request: toSnapshot(updatedReq, snap),
      messageId: msg.id,
    };
  });
}

export async function getTransactionRequestById(
  requestId: string,
  viewerId: string,
): Promise<DmTxRequestSnapshot | null> {
  const db = getDb();
  const [reqRow] = await db
    .select()
    .from(dmTransactionRequests)
    .where(eq(dmTransactionRequests.id, requestId))
    .limit(1);
  if (!reqRow) return null;
  if (reqRow.senderId !== viewerId && reqRow.recipientId !== viewerId) {
    return null;
  }
  const snap = await buildListingSnapshotRow(reqRow.listingId, reqRow.priceUsd);
  if (!snap) return null;
  return toSnapshot(reqRow, snap);
}

/**
 * Hydrates tx_request snapshots for a set of message rows in one batch. Used
 * by the messages list / stream poll so the client receives the current
 * request state on every render.
 */
export async function mapTxRequestsForMessages(
  rows: Array<{ txRequestId: string | null }>,
): Promise<Map<string, DmTxRequestSnapshot>> {
  const ids = Array.from(
    new Set(
      rows
        .map((r) => r.txRequestId)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  );
  if (ids.length === 0) return new Map();
  const db = getDb();
  const reqs = await db
    .select()
    .from(dmTransactionRequests)
    .where(inArray(dmTransactionRequests.id, ids));
  if (reqs.length === 0) return new Map();

  const listingIds = Array.from(new Set(reqs.map((r) => r.listingId)));
  const [listingRows, photoRows] = await Promise.all([
    db.select().from(listings).where(inArray(listings.id, listingIds)),
    db
      .select()
      .from(listingPhotos)
      .where(inArray(listingPhotos.listingId, listingIds))
      .orderBy(asc(listingPhotos.sortOrder)),
  ]);
  const listingById = new Map(listingRows.map((l) => [l.id, l]));
  const heroByListing = new Map<string, string>();
  for (const p of photoRows) {
    if (!heroByListing.has(p.listingId)) heroByListing.set(p.listingId, p.url);
  }

  const out = new Map<string, DmTxRequestSnapshot>();
  for (const req of reqs) {
    const listing = listingById.get(req.listingId);
    if (!listing) continue;
    const snap: DmListingSnapshot = {
      listingId: listing.id,
      title: listing.title,
      priceUsd: req.priceUsd,
      status: listing.status,
      imageUrl: heroByListing.get(listing.id) ?? null,
    };
    out.set(req.id, toSnapshot(req, snap));
  }
  return out;
}

export type DmTxRequestListItem = DmTxRequestSnapshot & {
  counterpart: {
    id: string;
    username: string;
    handle: string | null;
    walletAddress: string;
    profilePictureUrl: string | null;
  };
};

/** Incoming requests for the right-side drawer. */
export async function listIncomingTransactionRequests(
  userId: string,
  opts: { status?: 'pending' | 'resolved'; threadId?: string } = {},
): Promise<DmTxRequestListItem[]> {
  const db = getDb();
  const conditions = [eq(dmTransactionRequests.recipientId, userId)];
  if (opts.status === 'pending') {
    conditions.push(eq(dmTransactionRequests.status, 'pending'));
  } else if (opts.status === 'resolved') {
    conditions.push(
      sql`${dmTransactionRequests.status} in ('accepted','declined')`,
    );
  }
  if (opts.threadId) {
    conditions.push(eq(dmTransactionRequests.threadId, opts.threadId));
  }

  const rows = await db
    .select()
    .from(dmTransactionRequests)
    .where(and(...conditions))
    .orderBy(desc(dmTransactionRequests.createdAt));
  if (rows.length === 0) return [];

  const listingIds = Array.from(new Set(rows.map((r) => r.listingId)));
  const senderIds = Array.from(new Set(rows.map((r) => r.senderId)));

  const [listingRows, photoRows, senderRows] = await Promise.all([
    db.select().from(listings).where(inArray(listings.id, listingIds)),
    db
      .select()
      .from(listingPhotos)
      .where(inArray(listingPhotos.listingId, listingIds))
      .orderBy(asc(listingPhotos.sortOrder)),
    db.select().from(users).where(inArray(users.id, senderIds)),
  ]);
  const listingById = new Map(listingRows.map((l) => [l.id, l]));
  const heroByListing = new Map<string, string>();
  for (const p of photoRows) {
    if (!heroByListing.has(p.listingId)) heroByListing.set(p.listingId, p.url);
  }
  const senderById = new Map(senderRows.map((u) => [u.id, u]));

  const out: DmTxRequestListItem[] = [];
  for (const req of rows) {
    const listing = listingById.get(req.listingId);
    const sender = senderById.get(req.senderId);
    if (!listing || !sender) continue;
    const snap: DmListingSnapshot = {
      listingId: listing.id,
      title: listing.title,
      priceUsd: req.priceUsd,
      status: listing.status,
      imageUrl: heroByListing.get(listing.id) ?? null,
    };
    out.push({
      ...toSnapshot(req, snap),
      counterpart: {
        id: sender.id,
        username: sender.username,
        handle: sender.handle,
        walletAddress: sender.walletAddress,
        profilePictureUrl: sender.profilePictureUrl,
      },
    });
  }
  return out;
}

/** Map of threadId → number of pending incoming requests for `userId`. */
export async function countPendingIncomingByThread(
  userId: string,
): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db
    .select({
      threadId: dmTransactionRequests.threadId,
      n: sql<number>`count(*)::int`,
    })
    .from(dmTransactionRequests)
    .where(
      and(
        eq(dmTransactionRequests.recipientId, userId),
        eq(dmTransactionRequests.status, 'pending'),
      ),
    )
    .groupBy(dmTransactionRequests.threadId);

  const out = new Map<string, number>();
  for (const r of rows) out.set(r.threadId, r.n);
  return out;
}

export async function getTotalPendingIncoming(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dmTransactionRequests)
    .where(
      and(
        eq(dmTransactionRequests.recipientId, userId),
        eq(dmTransactionRequests.status, 'pending'),
      ),
    );
  return row?.n ?? 0;
}

/** Latest confirmed deal per listing id (used by receipt drawer). */
export async function getConfirmedDealsForListings(
  listingIds: string[],
): Promise<Map<string, typeof listingDeals.$inferSelect & { buyer: typeof users.$inferSelect }>> {
  if (listingIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({ deal: listingDeals, buyer: users })
    .from(listingDeals)
    .innerJoin(users, eq(listingDeals.buyerId, users.id))
    .where(
      and(
        inArray(listingDeals.listingId, listingIds),
        eq(listingDeals.status, 'confirmed'),
      ),
    )
    .orderBy(desc(listingDeals.confirmedAt));

  const latestByListing = new Map<
    string,
    typeof listingDeals.$inferSelect & { buyer: typeof users.$inferSelect }
  >();
  for (const { deal, buyer } of rows) {
    if (!latestByListing.has(deal.listingId)) {
      latestByListing.set(deal.listingId, { ...deal, buyer });
    }
  }
  return latestByListing;
}

export type PurchaseRow = {
  listing: typeof listings.$inferSelect;
  deal: typeof listingDeals.$inferSelect;
  seller: typeof users.$inferSelect;
  heroUrl: string | null;
};

/**
 * Confirmed purchases for a user (acting as buyer). Returns one row per
 * listing they have purchased — if somehow multiple confirmed deals exist,
 * the latest `confirmedAt` wins.
 */
export async function listPurchasesForUser(
  userId: string,
  limit = 100,
): Promise<PurchaseRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);

  const rows = await db
    .select({ deal: listingDeals, listing: listings, seller: users })
    .from(listingDeals)
    .innerJoin(listings, eq(listingDeals.listingId, listings.id))
    .innerJoin(users, eq(listingDeals.sellerId, users.id))
    .where(
      and(
        eq(listingDeals.buyerId, userId),
        eq(listingDeals.status, 'confirmed'),
      ),
    )
    .orderBy(desc(listingDeals.confirmedAt), desc(listingDeals.createdAt))
    .limit(cap);

  if (rows.length === 0) return [];

  const latestByListing = new Map<string, PurchaseRow>();
  for (const { deal, listing, seller } of rows) {
    if (!latestByListing.has(listing.id)) {
      latestByListing.set(listing.id, {
        listing,
        deal,
        seller,
        heroUrl: null,
      });
    }
  }

  const listingIds = Array.from(latestByListing.keys());
  const photoRows = await db
    .select()
    .from(listingPhotos)
    .where(inArray(listingPhotos.listingId, listingIds))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt));

  for (const p of photoRows) {
    const entry = latestByListing.get(p.listingId);
    if (entry && !entry.heroUrl) {
      entry.heroUrl = p.url;
    }
  }

  return Array.from(latestByListing.values());
}
