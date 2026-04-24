import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type * as schema from '@/db/schema';

import { getDb } from '@/db';
import type { ListingStatus } from '@/db/schema';
import { listingComments, listingLikes, listingPhotos, listings, users } from '@/db/schema';

type Schema = typeof schema;
type Db = PostgresJsDatabase<Schema>;
type Tx = PgTransaction<PostgresJsQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;

const STATUSES: ListingStatus[] = ['draft', 'active', 'pending', 'sold', 'archived'];

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

export type HomeListingRow = {
  listing: typeof listings.$inferSelect;
  seller: typeof users.$inferSelect;
  heroUrl: string | null;
};

/** Active feed for home: seller join + first photo URL per listing. */
export async function listActiveListingsWithSellerAndHero(limit = 20): Promise<HomeListingRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 50);

  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(and(eq(listings.status, 'active'), isNotNull(listings.publishedAt)))
    .orderBy(desc(listings.publishedAt), desc(listings.id))
    .limit(cap);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.listing.id);
  const photoRows = await db
    .select()
    .from(listingPhotos)
    .where(inArray(listingPhotos.listingId, ids))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt));

  const heroByListing = new Map<string, string>();
  for (const p of photoRows) {
    if (!heroByListing.has(p.listingId)) {
      heroByListing.set(p.listingId, p.url);
    }
  }

  return rows.map(({ listing, seller }) => ({
    listing,
    seller,
    heroUrl: heroByListing.get(listing.id) ?? null,
  }));
}

export type HomeListingWithPhotosRow = {
  listing: typeof listings.$inferSelect;
  seller: typeof users.$inferSelect;
  photos: string[];
  /** Total `listing_likes` rows for this listing (all users). */
  likeCount: number;
};

/** Active listings with seller join and all photo URLs (ordered) for design feed / carousels. */
export async function listActiveListingsWithSellerAndPhotos(
  limit = 50,
): Promise<HomeListingWithPhotosRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);

  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(and(eq(listings.status, 'active'), isNotNull(listings.publishedAt)))
    .orderBy(desc(listings.publishedAt), desc(listings.id))
    .limit(cap);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.listing.id);
  const [photoRows, likeAgg] = await Promise.all([
    db
      .select()
      .from(listingPhotos)
      .where(inArray(listingPhotos.listingId, ids))
      .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt)),
    db
      .select({
        listingId: listingLikes.listingId,
        n: sql<number>`count(*)::int`,
      })
      .from(listingLikes)
      .where(inArray(listingLikes.listingId, ids))
      .groupBy(listingLikes.listingId),
  ]);

  const photosByListing = new Map<string, string[]>();
  for (const p of photoRows) {
    const list = photosByListing.get(p.listingId) ?? [];
    list.push(p.url);
    photosByListing.set(p.listingId, list);
  }

  const likeCountByListing = new Map<string, number>();
  for (const r of likeAgg) {
    likeCountByListing.set(r.listingId, r.n);
  }

  return rows.map(({ listing, seller }) => ({
    listing,
    seller,
    photos: photosByListing.get(listing.id) ?? [],
    likeCount: likeCountByListing.get(listing.id) ?? 0,
  }));
}

/** Active or sold listings for a seller (public profile / feed-shaped rows). */
export async function listSellerListingsWithPhotosByStatus(
  sellerId: string,
  status: 'active' | 'sold',
  limit = 100,
): Promise<HomeListingWithPhotosRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);

  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(
      and(
        eq(listings.sellerId, sellerId),
        eq(listings.status, status),
        isNotNull(listings.publishedAt),
      ),
    )
    .orderBy(desc(listings.publishedAt), desc(listings.id))
    .limit(cap);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.listing.id);
  const photoRows = await db
    .select()
    .from(listingPhotos)
    .where(inArray(listingPhotos.listingId, ids))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt));

  const photosByListing = new Map<string, string[]>();
  for (const p of photoRows) {
    const list = photosByListing.get(p.listingId) ?? [];
    list.push(p.url);
    photosByListing.set(p.listingId, list);
  }

  const likeAgg = await db
    .select({
      listingId: listingLikes.listingId,
      n: sql<number>`count(*)::int`,
    })
    .from(listingLikes)
    .where(inArray(listingLikes.listingId, ids))
    .groupBy(listingLikes.listingId);
  const likeCountByListing = new Map<string, number>();
  for (const r of likeAgg) {
    likeCountByListing.set(r.listingId, r.n);
  }

  return rows.map(({ listing, seller }) => ({
    listing,
    seller,
    photos: photosByListing.get(listing.id) ?? [],
    likeCount: likeCountByListing.get(listing.id) ?? 0,
  }));
}

export async function countSellerListingsByStatus(sellerId: string, status: ListingStatus) {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), eq(listings.status, status)));
  return row?.n ?? 0;
}

export type SellerDashboardListingRow = {
  listing: typeof listings.$inferSelect;
  heroUrl: string | null;
};

/** Seller dashboard (all statuses): listings + first photo URL per row. */
export async function listSellerDashboardListingsWithHero(
  sellerId: string,
  limit = 100,
): Promise<SellerDashboardListingRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);
  const { items } = await listListings({
    sellerId,
    sellerDashboard: true,
    limit: cap,
  });
  if (items.length === 0) return [];

  const ids = items.map((l) => l.id);
  const photoRows = await db
    .select()
    .from(listingPhotos)
    .where(inArray(listingPhotos.listingId, ids))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt));

  const heroByListing = new Map<string, string>();
  for (const p of photoRows) {
    if (!heroByListing.has(p.listingId)) {
      heroByListing.set(p.listingId, p.url);
    }
  }

  return items.map((listing) => ({
    listing,
    heroUrl: heroByListing.get(listing.id) ?? null,
  }));
}

/** Paginated seller dashboard rows + cursor (same ordering as `listListings` seller dashboard). */
export async function listSellerDashboardListingsPageWithHero(
  sellerId: string,
  limit: number,
  cursor?: SellerListingCursor,
): Promise<{
  rows: SellerDashboardListingRow[];
  nextCursor: SellerListingCursor | undefined;
}> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);
  const { items, nextCursor: rawNext } = await listListings({
    sellerId,
    sellerDashboard: true,
    limit: cap,
    cursor,
  });
  const nextCursor: SellerListingCursor | undefined =
    rawNext && 'updatedAt' in rawNext ? rawNext : undefined;

  if (items.length === 0) {
    return { rows: [], nextCursor: undefined };
  }

  const ids = items.map((l) => l.id);
  const photoRows = await db
    .select()
    .from(listingPhotos)
    .where(inArray(listingPhotos.listingId, ids))
    .orderBy(asc(listingPhotos.sortOrder), asc(listingPhotos.createdAt));

  const heroByListing = new Map<string, string>();
  for (const p of photoRows) {
    if (!heroByListing.has(p.listingId)) {
      heroByListing.set(p.listingId, p.url);
    }
  }

  const rows = items.map((listing) => ({
    listing,
    heroUrl: heroByListing.get(listing.id) ?? null,
  }));

  return { rows, nextCursor };
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
