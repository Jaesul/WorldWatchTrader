import { getListingById, type Listing } from '@/lib/design/data';
import type { MyListing } from '@/lib/design/listing-store';
import type { ThreadMessage } from '@/lib/design/thread-store';

type ListingAttachment = NonNullable<ThreadMessage['listing']>;

/**
 * Primary photo for any shortened listing chip keyed by listing id:
 * prefers the current user's listing photo when the id matches `myListings`,
 * then optional server-provided catalog map, otherwise the mock feed catalog.
 */
export function getListingChipThumbnailById(
  listingId: string,
  myListings: MyListing[],
  catalogById?: Record<string, Pick<Listing, 'photos'>>,
): string | null {
  const mine = myListings.find((l) => l.id === listingId);
  if (mine?.photo) return mine.photo;
  const fromCatalog = catalogById?.[listingId];
  if (fromCatalog?.photos?.[0]) return fromCatalog.photos[0];
  const feed = getListingById(listingId);
  if (feed?.photos?.[0]) return feed.photos[0];
  return null;
}

/** Hero image for an inline listing card (feed catalog, your listings, or unknown). */
export function getListingAttachmentThumbnail(
  listing: ListingAttachment,
  myListings: MyListing[],
): string | null {
  return getListingChipThumbnailById(listing.id, myListings);
}
