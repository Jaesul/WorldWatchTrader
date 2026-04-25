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
import {
  parseUsdPerWldScaledFromEnv,
  readDmSettlementUsdPerWldFromEnv,
  wldAmountRawFromPriceUsd,
} from '@/lib/settlement/env-wld-quote';
import {
  extractExplorerTransactionHash,
  verifyMinikitPayment,
} from '@/lib/settlement/verify-minikit-payment';

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
  | 'invalid_user_op_hash'
  | 'invalid_settlement_rate'
  | 'invalid_payment_payload'
  | 'payment_verify_failed';

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
  payReference: string | null;
  settlementTokenSymbol: string | null;
  settlementAmountWldRaw: string | null;
  usdPerWldRateSnapshot: string | null;
  quoteLockedAt: string | null;
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
    payReference: req.payReference ?? null,
    settlementTokenSymbol: req.settlementTokenSymbol ?? null,
    settlementAmountWldRaw: req.settlementAmountRaw ?? null,
    usdPerWldRateSnapshot: req.usdPerWldRate ?? null,
    quoteLockedAt: req.quoteLockedAt ? req.quoteLockedAt.toISOString() : null,
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
  kind: 'minikit_pay';
  pay: {
    reference: string;
    to: string;
    tokens: Array<{ symbol: 'WLD'; token_amount: string }>;
    description: string;
  };
  settlement: {
    chainId: number;
    chainName: string;
    tokenSymbol: string;
    amountRaw: string;
    executedWith: 'minikit_pay';
    fromAddress: string;
    toAddress: string;
  };
};

function buildPreparePayloadFromLockedRow(
  reqRow: typeof dmTransactionRequests.$inferSelect,
  sellerWallet: string,
  buyerWallet: string,
): DmTxAcceptPreparePayload | null {
  if (
    !reqRow.payReference ||
    !reqRow.settlementAmountRaw ||
    !reqRow.quoteLockedAt ||
    !reqRow.usdPerWldRate
  ) {
    return null;
  }
  return {
    kind: 'minikit_pay',
    pay: {
      reference: reqRow.payReference,
      to: sellerWallet,
      tokens: [{ symbol: 'WLD', token_amount: reqRow.settlementAmountRaw }],
      description: `Listing purchase (request ${reqRow.id.slice(0, 8)})`,
    },
    settlement: {
      chainId: WORLD_CHAIN_ID,
      chainName: WORLD_CHAIN_NAME,
      tokenSymbol: reqRow.settlementTokenSymbol ?? 'WLD',
      amountRaw: reqRow.settlementAmountRaw,
      executedWith: 'minikit_pay',
      fromAddress: buyerWallet,
      toAddress: sellerWallet,
    },
  };
}

export async function prepareAcceptTransactionRequest(
  requestId: string,
  viewerId: string,
): Promise<
  | { ok: true; request: DmTxRequestSnapshot; payload: DmTxAcceptPreparePayload }
  | { ok: false; error: DmTxRequestError }
> {
  const db = getDb();
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

    const [buyer] = await tx.select().from(users).where(eq(users.id, reqRow.recipientId)).limit(1);
    const [seller] = await tx.select().from(users).where(eq(users.id, reqRow.senderId)).limit(1);
    if (!buyer || !seller) {
      return { ok: false as const, error: 'not_participant' as const };
    }
    if (!buyer.walletAddress || !seller.walletAddress) {
      return { ok: false as const, error: 'not_participant' as const };
    }
    const [listing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, reqRow.listingId))
      .limit(1);
    if (!listing) return { ok: false as const, error: 'listing_not_found' as const };
    if (listing.sellerId !== reqRow.senderId) {
      return { ok: false as const, error: 'not_seller' as const };
    }

    const snap = await buildListingSnapshotRow(reqRow.listingId, reqRow.priceUsd);
    if (!snap) return { ok: false as const, error: 'listing_not_found' as const };

    if (reqRow.quoteLockedAt && reqRow.payReference && reqRow.settlementAmountRaw) {
      const payload = buildPreparePayloadFromLockedRow(reqRow, seller.walletAddress, buyer.walletAddress);
      if (!payload) return { ok: false as const, error: 'invalid_status' as const };
      return { ok: true as const, request: toSnapshot(reqRow, snap), payload };
    }

    const rateParsed = parseUsdPerWldScaledFromEnv(readDmSettlementUsdPerWldFromEnv());
    if (!rateParsed.ok) {
      return { ok: false as const, error: 'invalid_settlement_rate' as const };
    }
    const { amountRaw, rateSnapshot } = wldAmountRawFromPriceUsd(reqRow.priceUsd, rateParsed.scaled);
    const amountStr = amountRaw.toString();
    const payReference = crypto.randomUUID().replace(/-/g, '');
    const now = new Date();

    const [updated] = await tx
      .update(dmTransactionRequests)
      .set({
        payReference,
        settlementTokenSymbol: 'WLD',
        settlementAmountRaw: amountStr,
        usdPerWldRate: rateSnapshot,
        quoteLockedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(dmTransactionRequests.id, requestId),
          eq(dmTransactionRequests.status, 'pending'),
          sql`${dmTransactionRequests.quoteLockedAt} IS NULL`,
        ),
      )
      .returning();

    let finalRow = updated;
    if (!finalRow) {
      const [again] = await tx
        .select()
        .from(dmTransactionRequests)
        .where(eq(dmTransactionRequests.id, requestId))
        .limit(1);
      if (!again?.quoteLockedAt || !again.payReference || !again.settlementAmountRaw) {
        return { ok: false as const, error: 'invalid_status' as const };
      }
      finalRow = again;
    }

    const payload = buildPreparePayloadFromLockedRow(
      finalRow,
      seller.walletAddress,
      buyer.walletAddress,
    );
    if (!payload) return { ok: false as const, error: 'invalid_status' as const };
    return { ok: true as const, request: toSnapshot(finalRow, snap), payload };
  });
}

export async function finalizeAcceptedTransactionRequest(input: {
  requestId: string;
  viewerId: string;
  payResult: { executedWith: string; data: Record<string, unknown> };
}): Promise<
  | { ok: true; request: DmTxRequestSnapshot; messageId: string; dealId: string }
  | { ok: false; error: DmTxRequestError }
> {
  const { executedWith, data } = input.payResult;
  if (executedWith !== 'minikit') {
    return { ok: false, error: 'invalid_payment_payload' };
  }
  const transactionId = typeof data.transactionId === 'string' ? data.transactionId.trim() : '';
  const reference = typeof data.reference === 'string' ? data.reference.trim() : '';
  const from = typeof data.from === 'string' ? data.from.trim().toLowerCase() : '';
  if (!transactionId || !reference) {
    return { ok: false, error: 'invalid_payment_payload' };
  }

  const db = getDb();
  const [preReq] = await db
    .select()
    .from(dmTransactionRequests)
    .where(eq(dmTransactionRequests.id, input.requestId))
    .limit(1);
  if (!preReq) return { ok: false, error: 'request_not_found' };
  if (preReq.recipientId !== input.viewerId) return { ok: false, error: 'not_recipient' };
  if (preReq.status !== 'pending') return { ok: false, error: 'already_resolved' };
  if (!preReq.payReference || !preReq.settlementAmountRaw) {
    return { ok: false, error: 'invalid_status' };
  }
  if (reference !== preReq.payReference) {
    return { ok: false, error: 'invalid_payment_payload' };
  }

  const [preBuyer] = await db
    .select()
    .from(users)
    .where(eq(users.id, preReq.recipientId))
    .limit(1);
  if (!preBuyer?.walletAddress) return { ok: false, error: 'not_participant' };
  if (from && from !== preBuyer.walletAddress.toLowerCase()) {
    return { ok: false, error: 'invalid_payment_payload' };
  }

  const verify = await verifyMinikitPayment(transactionId);
  if (verify.ok === false && verify.reason !== 'missing_config') {
    return { ok: false, error: 'payment_verify_failed' };
  }
  let verifiedChainTx: string | null = null;
  if (verify.ok === true) {
    const blob = JSON.stringify(verify.json).toLowerCase();
    if (!blob.includes(reference.toLowerCase())) {
      return { ok: false, error: 'payment_verify_failed' };
    }
    verifiedChainTx = extractExplorerTransactionHash(verify.json);
  }

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
    if (!reqRow.payReference || !reqRow.settlementAmountRaw) {
      return { ok: false as const, error: 'invalid_status' as const };
    }
    if (reference !== reqRow.payReference) {
      return { ok: false as const, error: 'invalid_payment_payload' as const };
    }

    const [buyer] = await tx.select().from(users).where(eq(users.id, reqRow.recipientId)).limit(1);
    const [seller] = await tx.select().from(users).where(eq(users.id, reqRow.senderId)).limit(1);
    if (!buyer?.walletAddress || !seller?.walletAddress) {
      return { ok: false as const, error: 'not_participant' as const };
    }
    if (from && from !== buyer.walletAddress.toLowerCase()) {
      return { ok: false as const, error: 'invalid_payment_payload' as const };
    }

    const [updatedReq] = await tx
      .update(dmTransactionRequests)
      .set({ status: 'accepted', resolvedAt: now, updatedAt: now })
      .where(eq(dmTransactionRequests.id, input.requestId))
      .returning();
    if (!updatedReq) throw new Error('Failed to update request to accepted');

    const lockedAmount = reqRow.settlementAmountRaw.trim();
    if (!/^\d+$/.test(lockedAmount)) {
      return { ok: false as const, error: 'invalid_price' as const };
    }

    const [deal] = await tx
      .insert(listingDeals)
      .values({
        listingId: reqRow.listingId,
        sellerId: reqRow.senderId,
        buyerId: reqRow.recipientId,
        status: 'confirmed',
        chainId: WORLD_CHAIN_ID,
        chainName: WORLD_CHAIN_NAME,
        userOpHash: transactionId,
        transactionHash: verifiedChainTx,
        fromAddress: buyer.walletAddress,
        toAddress: seller.walletAddress,
        tokenSymbol: 'WLD',
        amountRaw: lockedAmount,
        priceUsd: reqRow.priceUsd,
        executedWith: 'minikit_pay',
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
