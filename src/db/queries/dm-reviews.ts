import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { verifySiweMessage } from '@worldcoin/minikit-js/siwe';
import type { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js/commands';

import { getDb } from '@/db';
import { hashNonce } from '@/auth/wallet/client-helpers';
import {
  dmMessages,
  dmReviewRequests,
  dmReviews,
  dmThreads,
  listingDeals,
  listingPhotos,
  listings,
  type DmReviewRequestStatus,
} from '@/db/schema';

export type DmReviewRequestError =
  | 'thread_not_found'
  | 'forbidden'
  | 'invalid_deal'
  | 'deal_not_confirmed'
  | 'duplicate_request'
  | 'request_not_found'
  | 'invalid_status'
  | 'not_buyer'
  | 'invalid_rating'
  | 'invalid_signature';

export type DmReviewSnapshot = {
  reviewId: string;
  rating: number;
  comment: string | null;
  signedAt: string;
};

export type DmReviewRequestSnapshot = {
  requestId: string;
  threadId: string;
  dealId: string;
  sellerId: string;
  buyerId: string;
  status: DmReviewRequestStatus;
  listing: {
    listingId: string;
    title: string;
    imageUrl: string | null;
    priceUsd: number;
  };
  review: DmReviewSnapshot | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function cleanComment(comment: string | null | undefined): string | null {
  const v = (comment ?? '').trim();
  if (!v) return null;
  return v.slice(0, 1200);
}

function mapSnapshot(input: {
  request: typeof dmReviewRequests.$inferSelect;
  listing: typeof listings.$inferSelect;
  imageUrl: string | null;
  review: typeof dmReviews.$inferSelect | null;
}): DmReviewRequestSnapshot {
  return {
    requestId: input.request.id,
    threadId: input.request.threadId,
    dealId: input.request.listingDealId,
    sellerId: input.request.sellerId,
    buyerId: input.request.buyerId,
    status: input.request.status as DmReviewRequestStatus,
    listing: {
      listingId: input.listing.id,
      title: input.listing.title,
      imageUrl: input.imageUrl,
      priceUsd: input.listing.priceUsd,
    },
    review: input.review
      ? {
          reviewId: input.review.id,
          rating: input.review.rating,
          comment: input.review.comment,
          signedAt: input.review.submittedAt.toISOString(),
        }
      : null,
    completedAt: input.request.completedAt ? input.request.completedAt.toISOString() : null,
    expiresAt: input.request.expiresAt ? input.request.expiresAt.toISOString() : null,
    createdAt: input.request.createdAt.toISOString(),
    updatedAt: input.request.updatedAt.toISOString(),
  };
}

async function loadSnapshotByRequestId(requestId: string): Promise<DmReviewRequestSnapshot | null> {
  const db = getDb();
  const [row] = await db
    .select({
      request: dmReviewRequests,
      deal: listingDeals,
      listing: listings,
      review: dmReviews,
    })
    .from(dmReviewRequests)
    .innerJoin(listingDeals, eq(dmReviewRequests.listingDealId, listingDeals.id))
    .innerJoin(listings, eq(listingDeals.listingId, listings.id))
    .leftJoin(dmReviews, eq(dmReviews.reviewRequestId, dmReviewRequests.id))
    .where(eq(dmReviewRequests.id, requestId))
    .limit(1);
  if (!row) return null;
  const [photo] = await db
    .select({ url: listingPhotos.url })
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, row.listing.id))
    .orderBy(asc(listingPhotos.sortOrder))
    .limit(1);
  return mapSnapshot({
    request: row.request,
    listing: row.listing,
    imageUrl: photo?.url ?? null,
    review: row.review,
  });
}

export async function listLinkableCompletedDealsForThread(threadId: string, sellerId: string) {
  const db = getDb();
  const [thread] = await db.select().from(dmThreads).where(eq(dmThreads.id, threadId)).limit(1);
  if (!thread) return { ok: false as const, error: 'thread_not_found' as const };
  if (thread.sellerId !== sellerId && thread.buyerId !== sellerId) {
    return { ok: false as const, error: 'forbidden' as const };
  }
  const rows = await db
    .select({
      deal: listingDeals,
      listing: listings,
      requestId: dmReviewRequests.id,
      requestStatus: dmReviewRequests.status,
    })
    .from(listingDeals)
    .innerJoin(listings, eq(listingDeals.listingId, listings.id))
    .leftJoin(dmReviewRequests, eq(dmReviewRequests.listingDealId, listingDeals.id))
    .where(
      and(
        eq(listingDeals.status, 'confirmed'),
        eq(listingDeals.sellerId, sellerId),
        eq(listingDeals.buyerId, thread.buyerId === sellerId ? thread.sellerId : thread.buyerId),
      ),
    )
    .orderBy(desc(listingDeals.confirmedAt), desc(listingDeals.createdAt));

  const listingIds = Array.from(new Set(rows.map((r) => r.listing.id)));
  const photos = listingIds.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, listingIds))
        .orderBy(asc(listingPhotos.sortOrder))
    : [];
  const hero = new Map<string, string>();
  for (const p of photos) if (!hero.has(p.listingId)) hero.set(p.listingId, p.url);

  return {
    ok: true as const,
    deals: rows.map((r) => ({
      dealId: r.deal.id,
      listingId: r.listing.id,
      title: r.listing.title,
      priceUsd: r.deal.priceUsd,
      confirmedAt: r.deal.confirmedAt ? r.deal.confirmedAt.toISOString() : null,
      imageUrl: hero.get(r.listing.id) ?? null,
      existingRequestId: r.requestId ?? null,
      existingRequestStatus: (r.requestStatus as DmReviewRequestStatus | null) ?? null,
    })),
  };
}

export async function createReviewRequest(input: {
  threadId: string;
  listingDealId: string;
  sellerId: string;
}): Promise<{ ok: true; request: DmReviewRequestSnapshot; messageId: string } | { ok: false; error: DmReviewRequestError }> {
  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [thread] = await tx.select().from(dmThreads).where(eq(dmThreads.id, input.threadId)).limit(1);
    if (!thread) return { ok: false as const, error: 'thread_not_found' as const };
    if (thread.sellerId !== input.sellerId && thread.buyerId !== input.sellerId) {
      return { ok: false as const, error: 'forbidden' as const };
    }
    const [deal] = await tx
      .select()
      .from(listingDeals)
      .where(eq(listingDeals.id, input.listingDealId))
      .limit(1);
    if (!deal) return { ok: false as const, error: 'invalid_deal' as const };
    if (deal.status !== 'confirmed') return { ok: false as const, error: 'deal_not_confirmed' as const };
    if (deal.sellerId !== input.sellerId) return { ok: false as const, error: 'forbidden' as const };
    const counterpartId = thread.buyerId === input.sellerId ? thread.sellerId : thread.buyerId;
    if (deal.buyerId !== counterpartId) return { ok: false as const, error: 'invalid_deal' as const };

    const [existing] = await tx
      .select({ id: dmReviewRequests.id })
      .from(dmReviewRequests)
      .where(eq(dmReviewRequests.listingDealId, input.listingDealId))
      .limit(1);
    if (existing) return { ok: false as const, error: 'duplicate_request' as const };

    const [created] = await tx
      .insert(dmReviewRequests)
      .values({
        threadId: input.threadId,
        listingDealId: input.listingDealId,
        sellerId: input.sellerId,
        buyerId: deal.buyerId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new Error('Failed to create review request');

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: input.threadId,
        senderId: input.sellerId,
        body: '',
        reviewRequestId: created.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to create review message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, input.threadId));

    const snap = await loadSnapshotByRequestId(created.id);
    if (!snap) throw new Error('Failed to hydrate review request');
    return { ok: true as const, request: snap, messageId: msg.id };
  });
}

export async function getReviewRequestById(requestId: string, viewerId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(dmReviewRequests)
    .where(eq(dmReviewRequests.id, requestId))
    .limit(1);
  if (!row) return null;
  if (row.sellerId !== viewerId && row.buyerId !== viewerId) return null;
  return loadSnapshotByRequestId(requestId);
}

export async function submitDealReview(input: {
  requestId: string;
  buyerId: string;
  rating: number;
  comment: string | null;
  nonce: string;
  signedNonce: string;
  walletAuthPayload: MiniAppWalletAuthSuccessPayload;
}): Promise<{ ok: true; request: DmReviewRequestSnapshot; messageId: string } | { ok: false; error: DmReviewRequestError }> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'invalid_rating' };
  }
  if (hashNonce({ nonce: input.nonce }) !== input.signedNonce) {
    return { ok: false, error: 'invalid_signature' };
  }
  const verified = await verifySiweMessage(input.walletAuthPayload, input.nonce);
  if (!verified.isValid || !verified.siweMessageData.address) {
    return { ok: false, error: 'invalid_signature' };
  }
  const signerAddress = verified.siweMessageData.address;

  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(dmReviewRequests)
      .where(eq(dmReviewRequests.id, input.requestId))
      .limit(1);
    if (!request) return { ok: false as const, error: 'request_not_found' as const };
    if (request.buyerId !== input.buyerId) return { ok: false as const, error: 'not_buyer' as const };
    if (request.status !== 'pending') return { ok: false as const, error: 'invalid_status' as const };

    const [review] = await tx
      .insert(dmReviews)
      .values({
        reviewRequestId: request.id,
        listingDealId: request.listingDealId,
        sellerId: request.sellerId,
        buyerId: request.buyerId,
        rating: input.rating,
        comment: cleanComment(input.comment),
        signedMessage: input.walletAuthPayload.message,
        signature: input.walletAuthPayload.signature,
        signerAddress,
        signedNonce: input.signedNonce,
        submittedAt: now,
        createdAt: now,
      })
      .returning();
    if (!review) throw new Error('Failed to insert review');

    const [updated] = await tx
      .update(dmReviewRequests)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(dmReviewRequests.id, request.id))
      .returning();
    if (!updated) throw new Error('Failed to update review request');

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: request.threadId,
        senderId: request.buyerId,
        body: '',
        reviewRequestId: request.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to create review update message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, request.threadId));

    const snap = await loadSnapshotByRequestId(updated.id);
    if (!snap) throw new Error('Failed to load review snapshot');
    return { ok: true as const, request: snap, messageId: msg.id };
  });
}

export async function mapReviewRequestsForMessages(
  rows: Array<{ reviewRequestId: string | null }>,
): Promise<Map<string, DmReviewRequestSnapshot>> {
  const ids = Array.from(new Set(rows.map((r) => r.reviewRequestId).filter((v): v is string => !!v)));
  if (ids.length === 0) return new Map();
  const db = getDb();
  const hydrated = await db
    .select({
      request: dmReviewRequests,
      review: dmReviews,
      deal: listingDeals,
      listing: listings,
    })
    .from(dmReviewRequests)
    .innerJoin(listingDeals, eq(dmReviewRequests.listingDealId, listingDeals.id))
    .innerJoin(listings, eq(listingDeals.listingId, listings.id))
    .leftJoin(dmReviews, eq(dmReviews.reviewRequestId, dmReviewRequests.id))
    .where(inArray(dmReviewRequests.id, ids));
  const listingIds = Array.from(new Set(hydrated.map((r) => r.listing.id)));
  const photos = listingIds.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, listingIds))
        .orderBy(asc(listingPhotos.sortOrder))
    : [];
  const heroByListing = new Map<string, string>();
  for (const p of photos) if (!heroByListing.has(p.listingId)) heroByListing.set(p.listingId, p.url);

  const out = new Map<string, DmReviewRequestSnapshot>();
  for (const row of hydrated) {
    out.set(
      row.request.id,
      mapSnapshot({
        request: row.request,
        listing: row.listing,
        review: row.review,
        imageUrl: heroByListing.get(row.listing.id) ?? null,
      }),
    );
  }
  return out;
}

export async function mapDealReviewsByDealIds(dealIds: string[]) {
  if (dealIds.length === 0) return new Map<string, { rating: number; comment: string | null; createdAt: string }>();
  const db = getDb();
  const rows = await db
    .select()
    .from(dmReviews)
    .where(inArray(dmReviews.listingDealId, dealIds));
  const out = new Map<string, { rating: number; comment: string | null; createdAt: string }>();
  for (const row of rows) {
    out.set(row.listingDealId, {
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
    });
  }
  return out;
}

export async function getSellerReviewSummary(sellerId: string): Promise<{
  totalReviews: number;
  positiveReviews: number;
  positivePercent: number;
}> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      positive: sql<number>`count(*) FILTER (WHERE ${dmReviews.rating} >= 4)::int`,
    })
    .from(dmReviews)
    .where(eq(dmReviews.sellerId, sellerId));
  const total = row?.total ?? 0;
  const positive = row?.positive ?? 0;
  return {
    totalReviews: total,
    positiveReviews: positive,
    positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
  };
}

