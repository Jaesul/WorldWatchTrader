import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import type { HomeListingWithPhotosRow } from '@/db/queries/listings';
import { listingLikes, listingPhotos, listingSaves, listings, users } from '@/db/schema';

export async function saveListing(userId: string, listingId: string) {
  const db = getDb();
  await db
    .insert(listingSaves)
    .values({ userId, listingId })
    .onConflictDoNothing({ target: [listingSaves.userId, listingSaves.listingId] });
}

export async function unsaveListing(userId: string, listingId: string) {
  const db = getDb();
  await db
    .delete(listingSaves)
    .where(and(eq(listingSaves.userId, userId), eq(listingSaves.listingId, listingId)));
}

export async function isListingSavedByUser(userId: string, listingId: string) {
  const db = getDb();
  const rows = await db
    .select({ one: listingSaves.userId })
    .from(listingSaves)
    .where(and(eq(listingSaves.userId, userId), eq(listingSaves.listingId, listingId)))
    .limit(1);
  return Boolean(rows[0]);
}

export async function listSavedListingIds(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ listingId: listingSaves.listingId })
    .from(listingSaves)
    .innerJoin(listings, eq(listingSaves.listingId, listings.id))
    .where(and(eq(listingSaves.userId, userId), ne(listings.status, 'archived')))
    .orderBy(desc(listingSaves.createdAt));
  return rows.map((r) => r.listingId);
}

export async function listSavedListingsForUser(userId: string, limit = 50) {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);
  return db
    .select({
      savedAt: listingSaves.createdAt,
      listing: listings,
    })
    .from(listingSaves)
    .innerJoin(listings, eq(listingSaves.listingId, listings.id))
    .where(
      and(eq(listingSaves.userId, userId), eq(listings.status, 'active')),
    )
    .orderBy(desc(listingSaves.createdAt))
    .limit(cap);
}

/** Saved listings (any status) with seller + ordered photo URLs for design feed / saved tab. */
export async function listSavedListingsWithSellerAndPhotos(
  userId: string,
  limit = 50,
): Promise<HomeListingWithPhotosRow[]> {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);

  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listingSaves)
    .innerJoin(listings, eq(listingSaves.listingId, listings.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(and(eq(listingSaves.userId, userId), ne(listings.status, 'archived')))
    .orderBy(desc(listingSaves.createdAt))
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
