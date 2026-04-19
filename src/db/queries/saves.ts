import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { listingSaves, listings } from '@/db/schema';

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
    .where(eq(listingSaves.userId, userId))
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
