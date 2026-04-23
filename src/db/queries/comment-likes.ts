import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { listingCommentLikes, listingComments } from '@/db/schema';

export async function likeComment(userId: string, commentId: string) {
  const db = getDb();
  await db
    .insert(listingCommentLikes)
    .values({ userId, commentId })
    .onConflictDoNothing({ target: [listingCommentLikes.userId, listingCommentLikes.commentId] });
}

export async function unlikeComment(userId: string, commentId: string) {
  const db = getDb();
  await db
    .delete(listingCommentLikes)
    .where(
      and(
        eq(listingCommentLikes.userId, userId),
        eq(listingCommentLikes.commentId, commentId),
      ),
    );
}

export async function listLikedCommentIdsForUser(userId: string, limit = 5000) {
  const db = getDb();
  const cap = Math.min(Math.max(limit, 1), 5000);
  const rows = await db
    .select({ commentId: listingCommentLikes.commentId })
    .from(listingCommentLikes)
    .where(eq(listingCommentLikes.userId, userId))
    .orderBy(desc(listingCommentLikes.createdAt))
    .limit(cap);
  return rows.map((r) => r.commentId);
}

function isUndefinedRelationError(e: unknown): boolean {
  const chain: unknown[] = [e];
  const first = e && typeof e === 'object' && 'cause' in e ? (e as { cause: unknown }).cause : null;
  if (first) chain.push(first);
  for (const err of chain) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '42P01'
    ) {
      return true;
    }
  }
  return false;
}

export async function countCommentLikesByCommentIds(
  commentIds: string[],
): Promise<Record<string, number>> {
  if (commentIds.length === 0) return {};
  try {
    const db = getDb();
    const rows = await db
      .select({
        commentId: listingCommentLikes.commentId,
        n: sql<number>`count(*)::int`,
      })
      .from(listingCommentLikes)
      .where(inArray(listingCommentLikes.commentId, commentIds))
      .groupBy(listingCommentLikes.commentId);
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[r.commentId] = r.n;
    }
    return out;
  } catch (e) {
    /** Table missing until `npm run db:migrate` — avoid 500 on /design. */
    if (isUndefinedRelationError(e)) return {};
    throw e;
  }
}

export async function getActiveCommentById(commentId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: listingComments.id })
    .from(listingComments)
    .where(and(eq(listingComments.id, commentId), isNull(listingComments.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}
