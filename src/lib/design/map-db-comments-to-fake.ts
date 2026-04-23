import type { ListingCommentWithAuthor } from '@/db/queries/comments';
import { formatPublishedAtLabel } from '@/lib/design/map-db-feed-to-listing';
import type { FakeComment } from '@/lib/design/listing-drawer-comments';

const AVATAR_FALLBACK = 'https://i.pravatar.cc/150?u=comment-author';

export function mapDbCommentRowToFake(
  row: ListingCommentWithAuthor,
  likeCount = 0,
): FakeComment {
  const { comment, author } = row;
  const display =
    author.username?.trim() ||
    author.handle?.trim() ||
    `User ${author.id.replace(/^0x/i, '').slice(0, 6)}`;

  return {
    id: comment.id,
    author: display,
    avatar: author.profilePictureUrl?.trim() || `${AVATAR_FALLBACK}&u=${encodeURIComponent(author.id)}`,
    body: comment.body,
    timeLabel: formatPublishedAtLabel(comment.createdAt),
    likes: likeCount,
    authorUserId: comment.authorId,
  };
}

export function groupDbCommentRowsByListingId(
  rows: ListingCommentWithAuthor[],
  likeCountByCommentId: Record<string, number> = {},
): Record<string, FakeComment[]> {
  const out: Record<string, FakeComment[]> = {};
  for (const row of rows) {
    const lid = row.comment.listingId;
    const list = out[lid] ?? [];
    const n = likeCountByCommentId[row.comment.id] ?? 0;
    list.push(mapDbCommentRowToFake(row, n));
    out[lid] = list;
  }
  return out;
}
