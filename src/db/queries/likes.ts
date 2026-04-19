import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { listingLikes, listings } from '@/db/schema';

export async function likeListing(userId: string, listingId: string) {
  const db = getDb();
  await db
    .insert(listingLikes)
    .values({ userId, listingId })
    .onConflictDoNothing({ target: [listingLikes.userId, listingLikes.listingId] });
}

export async function unlikeListing(userId: string, listingId: string) {
  const db = getDb();
  await db
    .delete(listingLikes)
    .where(and(eq(listingLikes.userId, userId), eq(listingLikes.listingId, listingId)));
}

export async function isListingLikedByUser(userId: string, listingId: string) {
  const db = getDb();
  const rows = await db
    .select({ one: listingLikes.userId })
    .from(listingLikes)
    .where(and(eq(listingLikes.userId, userId), eq(listingLikes.listingId, listingId)))
    .limit(1);
  return Boolean(rows[0]);
}

export async function listLikedListingIds(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ listingId: listingLikes.listingId })
    .from(listingLikes)
    .where(eq(listingLikes.userId, userId))
    .orderBy(desc(listingLikes.createdAt));
  return rows.map((r) => r.listingId);
}

/** Liked listings with listing row (active + published only). */
export async function listLikedListingsForUser(userId: string, limit = 50) {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 100);
  return db
    .select({
      likedAt: listingLikes.createdAt,
      listing: listings,
    })
    .from(listingLikes)
    .innerJoin(listings, eq(listingLikes.listingId, listings.id))
    .where(
      and(eq(listingLikes.userId, userId), eq(listings.status, 'active')),
    )
    .orderBy(desc(listingLikes.createdAt))
    .limit(cap);
}
