import type { HomeListingWithPhotosRow } from '@/db/queries/listings';
import type { Badge, Listing } from '@/lib/design/data';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?u=unknown-seller';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1611243705491-71487c2ed137?auto=format&fit=crop&w=800&q=80';

const BOX_PAPERS_RE = /\n\nBox\/papers:\s*([\s\S]+)$/;

export type DesignFeedListing = Listing & { _publishedAt: number; _sellerId: string };

function parseBoxPapers(details: string): string {
  const m = details.match(BOX_PAPERS_RE);
  return m?.[1]?.trim() ?? '';
}

function descriptionFromDetails(details: string): string {
  const stripped = details.replace(BOX_PAPERS_RE, '').trim();
  return stripped || details.trim();
}

export function formatPublishedAtLabel(publishedAt: Date, nowMs = Date.now()): string {
  const diffMs = Math.max(0, nowMs - publishedAt.getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function sellerHandle(seller: HomeListingWithPhotosRow['seller']): string {
  if (seller.handle) return seller.handle;
  return `user_${seller.id.replace(/^0x/i, '').slice(0, 10)}`;
}

function sellerBadges(seller: HomeListingWithPhotosRow['seller']): Badge[] {
  const badges: Badge[] = [];
  if (seller.orbVerified) badges.push('world-verified');
  if (seller.powerSeller) badges.push('power-seller');
  return badges;
}

export function mapDbRowToDesignFeedListing(row: HomeListingWithPhotosRow): DesignFeedListing {
  const { listing, seller, photos, likeCount } = row;
  const publishedAt = listing.publishedAt ?? listing.updatedAt;
  const details = listing.details ?? '';

  const base: Listing = {
    id: listing.id,
    model: listing.title,
    price: listing.priceUsd,
    description: descriptionFromDetails(details),
    condition: listing.condition ?? '',
    boxPapers: parseBoxPapers(details),
    postedAt: formatPublishedAtLabel(publishedAt),
    likes: likeCount,
    seller: {
      name: seller.username,
      handle: sellerHandle(seller),
      badges: sellerBadges(seller),
      avatar: seller.profilePictureUrl ?? PLACEHOLDER_AVATAR,
    },
    photos: photos.length > 0 ? photos : [FALLBACK_HERO],
  };

  return { ...base, _publishedAt: publishedAt.getTime(), _sellerId: seller.id };
}

export function mapDbFeedToDesignListings(rows: HomeListingWithPhotosRow[]): DesignFeedListing[] {
  return rows.map(mapDbRowToDesignFeedListing);
}
