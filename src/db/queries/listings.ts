import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type * as schema from '@/db/schema';

import { getDb } from '@/db';
import type { ListingStatus } from '@/db/schema';
import { listingComments, listingLikes, listingPhotos, listings, users } from '@/db/schema';

type Schema = typeof schema;
type Db = PostgresJsDatabase<Schema>;
type Tx = PgTransaction<PostgresJsQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;

const STATUSES: ListingStatus[] = ['draft', 'active', 'sold', 'archived'];

function assertStatus(s: string): asserts s is ListingStatus {
  if (!STATUSES.includes(s as ListingStatus)) {
    throw new Error(`Invalid listing status: ${s}`);
  }
}

export type CreateListingInput = {
  title: string;
  teaser?: string;
  details?: string;
  priceUsd: number;
  condition?: string | null;
  modelNumber?: string | null;
  caseSize?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  countryCode?: string | null;
  orbVerifiedAtListing?: Date | null;
};

export type UpdateListingInput = Partial<{
  title: string;
  teaser: string;
  details: string;
  priceUsd: number;
  condition: string | null;
  modelNumber: string | null;
  caseSize: string | null;
  city: string | null;
  stateRegion: string | null;
  countryCode: string | null;
  orbVerifiedAtListing: Date | null;
  status: ListingStatus;
}>;

function assertWholeDollars(priceUsd: number) {
  if (!Number.isInteger(priceUsd) || priceUsd < 0) {
    throw new Error('priceUsd must be a non-negative integer (whole USD)');
  }
}

async function assertSellerOwnsListing(tx: Db | Tx, sellerId: string, listingId: string) {
  const found = await tx
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, sellerId)))
    .limit(1);
  if (!found[0]) {
    throw new Error('Listing not found or forbidden');
  }
}

export async function createListing(
  sellerId: string,
  input: CreateListingInput,
  photoUrls: string[],
) {
  assertWholeDollars(input.priceUsd);
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [listing] = await tx
      .insert(listings)
      .values({
        sellerId,
        status: 'draft',
        title: input.title,
        teaser: input.teaser ?? '',
        details: input.details ?? '',
        priceUsd: input.priceUsd,
        condition: input.condition ?? null,
        modelNumber: input.modelNumber ?? null,
        caseSize: input.caseSize ?? null,
        city: input.city ?? null,
        stateRegion: input.stateRegion ?? null,
        countryCode: input.countryCode ?? null,
        orbVerifiedAtListing: input.orbVerifiedAtListing ?? null,
        updatedAt: now,
      })
      .returning();

    if (!listing) throw new Error('Failed to create listing');

    if (photoUrls.length > 0) {
      await tx.insert(listingPhotos).values(
        photoUrls.map((url, i) => ({
          listingId: listing.id,
          url,
          sortOrder: i,
        })),
      );
    }

    return listing;
  });
}

export type ListingCursor = { publishedAt: Date; id: string };
export type SellerListingCursor = { updatedAt: Date; id: string };

export type ListListingsParams = {
  status?: ListingStatus | ListingStatus[];
  sellerId?: string;
  /** Seller’s drafts / all statuses without requiring `published_at`. */
  sellerDashboard?: boolean;
  cursor?: ListingCursor | SellerListingCursor;
  limit?: number;
};

export async function listListings(params: ListListingsParams = {}) {
  const db = getDb();
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const statusFilter = params.status
    ? Array.isArray(params.status)
      ? params.status
      : [params.status]
    : params.sellerDashboard && params.sellerId
      ? (STATUSES as ListingStatus[])
      : (['active'] as const);

  for (const s of statusFilter) assertStatus(s);

  const conditions = [inArray(listings.status, statusFilter as ListingStatus[])];

  if (params.sellerId) {
    conditions.push(eq(listings.sellerId, params.sellerId));
  }

  if (params.sellerDashboard && params.sellerId) {
    if (params.cursor && 'updatedAt' in params.cursor) {
      const c = params.cursor;
      conditions.push(
        or(
          lt(listings.updatedAt, c.updatedAt),
          and(eq(listings.updatedAt, c.updatedAt), lt(listings.id, c.id)),
        )!,
      );
    }
    const rows = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.updatedAt), desc(listings.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? {
            updatedAt: items[items.length - 1]!.updatedAt,
            id: items[items.length - 1]!.id,
          }
        : undefined;

    return { items, nextCursor };
  }

  conditions.push(isNotNull(listings.publishedAt));

  if (params.cursor && 'publishedAt' in params.cursor) {
    const c = params.cursor;
    conditions.push(
      or(
        lt(listings.publishedAt, c.publishedAt),
        and(eq(listings.publishedAt, c.publishedAt), lt(listings.id, c.id)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.publishedAt), desc(listings.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && items.length > 0
      ? {
          publishedAt: items[items.length - 1]!.publishedAt!,
          id: items[items.length - 1]!.id,
        }
      : undefined;

  return { items, nextCursor };
}

export type GetListingOptions = {
  viewerUserId?: string | null;
};

export async function getListingById(listingId: string, options: GetListingOptions = {}) {
  const db = getDb();
  const rows = await db
    .select({
      listing: listings,
      seller: users,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const { listing, seller } = row;
  if (listing.status === 'draft') {
    if (!options.viewerUserId || options.viewerUserId !== listing.sellerId) {
      return null;
    }
  }

  const photos = await db
    .select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(listingPhotos.sortOrder, listingPhotos.createdAt);

  const [likeAgg] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listingLikes)
    .where(eq(listingLikes.listingId, listingId));

  const [commentAgg] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listingComments)
    .where(and(eq(listingComments.listingId, listingId), isNull(listingComments.deletedAt)));

  return {
    listing,
    seller,
    photos,
    likeCount: likeAgg?.n ?? 0,
    commentCount: commentAgg?.n ?? 0,
  };
}

export async function updateListing(
  sellerId: string,
  listingId: string,
  patch: UpdateListingInput,
  photoUrls?: string[],
) {
  if (patch.priceUsd !== undefined) {
    assertWholeDollars(patch.priceUsd);
  }
  if (patch.status !== undefined) {
    assertStatus(patch.status);
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await assertSellerOwnsListing(tx, sellerId, listingId);

    const setValues: Partial<typeof listings.$inferInsert> = { updatedAt: now };
    if (patch.title !== undefined) setValues.title = patch.title;
    if (patch.teaser !== undefined) setValues.teaser = patch.teaser;
    if (patch.details !== undefined) setValues.details = patch.details;
    if (patch.priceUsd !== undefined) setValues.priceUsd = patch.priceUsd;
    if (patch.condition !== undefined) setValues.condition = patch.condition;
    if (patch.modelNumber !== undefined) setValues.modelNumber = patch.modelNumber;
    if (patch.caseSize !== undefined) setValues.caseSize = patch.caseSize;
    if (patch.city !== undefined) setValues.city = patch.city;
    if (patch.stateRegion !== undefined) setValues.stateRegion = patch.stateRegion;
    if (patch.countryCode !== undefined) setValues.countryCode = patch.countryCode;
    if (patch.orbVerifiedAtListing !== undefined) {
      setValues.orbVerifiedAtListing = patch.orbVerifiedAtListing;
    }
    if (patch.status !== undefined) setValues.status = patch.status;

    await tx.update(listings).set(setValues).where(eq(listings.id, listingId));

    if (photoUrls) {
      await tx.delete(listingPhotos).where(eq(listingPhotos.listingId, listingId));
      if (photoUrls.length > 0) {
        await tx.insert(listingPhotos).values(
          photoUrls.map((url, i) => ({
            listingId,
            url,
            sortOrder: i,
          })),
        );
      }
    }

    const [listing] = await tx.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    return listing ?? null;
  });
}

export async function publishListing(sellerId: string, listingId: string) {
  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    await assertSellerOwnsListing(tx, sellerId, listingId);
    const [row] = await tx
      .update(listings)
      .set({
        status: 'active',
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(listings.id, listingId))
      .returning();
    return row ?? null;
  });
}

export async function archiveListing(sellerId: string, listingId: string) {
  const db = getDb();
  const now = new Date();
  return db.transaction(async (tx) => {
    await assertSellerOwnsListing(tx, sellerId, listingId);
    const [row] = await tx
      .update(listings)
      .set({ status: 'archived', updatedAt: now })
      .where(eq(listings.id, listingId))
      .returning();
    return row ?? null;
  });
}

export async function deleteListing(sellerId: string, listingId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    await assertSellerOwnsListing(tx, sellerId, listingId);
    await tx.delete(listings).where(eq(listings.id, listingId));
    return true;
  });
}
