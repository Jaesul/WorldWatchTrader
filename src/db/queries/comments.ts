import { and, asc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { listingComments, listings, users } from '@/db/schema';

const MAX_BODY = 4000;

function normalizeBody(body: string) {
  const t = body.trim();
  if (!t) throw new Error('Comment body is required');
  if (t.length > MAX_BODY) throw new Error(`Comment body must be at most ${MAX_BODY} characters`);
  return t;
}

export async function createComment(authorId: string, listingId: string, body: string) {
  const db = getDb();
  const text = normalizeBody(body);
  const now = new Date();

  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) throw new Error('Listing not found');

  const [row] = await db
    .insert(listingComments)
    .values({
      listingId,
      authorId,
      body: text,
      updatedAt: now,
    })
    .returning();
  return row ?? null;
}

export async function listCommentsForListing(listingId: string) {
  const db = getDb();
  return db
    .select({
      comment: listingComments,
      author: users,
    })
    .from(listingComments)
    .innerJoin(users, eq(listingComments.authorId, users.id))
    .where(and(eq(listingComments.listingId, listingId), isNull(listingComments.deletedAt)))
    .orderBy(asc(listingComments.createdAt));
}

export async function updateComment(authorId: string, commentId: string, body: string) {
  const db = getDb();
  const text = normalizeBody(body);
  const now = new Date();

  const [row] = await db
    .update(listingComments)
    .set({ body: text, updatedAt: now })
    .where(
      and(
        eq(listingComments.id, commentId),
        eq(listingComments.authorId, authorId),
        isNull(listingComments.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function deleteComment(authorId: string, commentId: string) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(listingComments)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(listingComments.id, commentId),
        eq(listingComments.authorId, authorId),
        isNull(listingComments.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}
