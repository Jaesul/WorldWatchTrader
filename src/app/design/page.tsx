import { countCommentLikesByCommentIds } from '@/db/queries/comment-likes';
import { listCommentsForListingIds } from '@/db/queries/comments';
import { listActiveListingsWithSellerAndPhotos } from '@/db/queries/listings';
import { groupDbCommentRowsByListingId } from '@/lib/design/map-db-comments-to-fake';
import { mapDbFeedToDesignListings } from '@/lib/design/map-db-feed-to-listing';

import { DesignMarketplaceClient } from './DesignMarketplaceClient';

export default async function DesignMarketplacePage() {
  const rows = await listActiveListingsWithSellerAndPhotos(50);
  const initialListings = mapDbFeedToDesignListings(rows);
  const listingIds = rows.map((r) => r.listing.id);
  const commentRows = await listCommentsForListingIds(listingIds);
  const commentIds = commentRows.map((r) => r.comment.id);
  const commentLikeCounts = await countCommentLikesByCommentIds(commentIds);
  const initialCommentsByListingId = groupDbCommentRowsByListingId(
    commentRows,
    commentLikeCounts,
  );

  return (
    <DesignMarketplaceClient
      initialListings={initialListings}
      initialCommentsByListingId={initialCommentsByListingId}
    />
  );
}
