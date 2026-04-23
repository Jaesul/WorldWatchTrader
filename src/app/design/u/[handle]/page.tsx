import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PublicProfileActiveListings } from '@/components/design/PublicProfileActiveListings';
import type { PublicProfileListingRow } from '@/components/design/PublicProfileActiveListings';
import { PublicProfileSoldListings } from '@/components/design/PublicProfileSoldListings';
import { Button } from '@/components/ui/button';
import {
  countSellerListingsByStatus,
  listSellerListingsWithPhotosByStatus,
} from '@/db/queries/listings';
import { getUserByPublicProfileSlug } from '@/db/queries/users';
import type { Listing } from '@/lib/design/data';
import { mapHomeRowToDesignListing } from '@/lib/design/map-db-feed-to-listing';
import {
  buildMockPublicProfileSoldParts,
  type PublicProfileSoldRow,
} from '@/lib/design/on-chain-sale-mock';
import {
  memberSinceLabel,
  profileDisplayName,
  publicProfileSalesAndPositivePercent,
} from '@/lib/design/public-profile-stats';

export const revalidate = 60;

function priceChip(listing: Listing): string {
  return `$${listing.price.toLocaleString('en-US')}`;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const slug = decodeURIComponent((await params).handle);
  const user = await getUserByPublicProfileSlug(slug);
  if (!user) notFound();

  const soldCountFromDb = await countSellerListingsByStatus(user.id, 'sold');
  const { sales, positiveRate } = publicProfileSalesAndPositivePercent({
    userId: user.id,
    username: user.username,
    handle: user.handle,
    soldCountFromDb,
  });

  const [activeRows, soldRowsDb] = await Promise.all([
    listSellerListingsWithPhotosByStatus(user.id, 'active', 100),
    listSellerListingsWithPhotosByStatus(user.id, 'sold', 100),
  ]);

  const listingsById: Record<string, Listing> = {};
  for (const row of activeRows) {
    const l = mapHomeRowToDesignListing(row);
    listingsById[l.id] = l;
  }
  for (const row of soldRowsDb) {
    const l = mapHomeRowToDesignListing(row);
    listingsById[l.id] = l;
  }

  const activePreviewRows: PublicProfileListingRow[] = activeRows.map((row) => {
    const l = mapHomeRowToDesignListing(row);
    return {
      id: l.id,
      model: l.model,
      price: priceChip(l),
      condition: l.condition || '—',
    };
  });

  const soldListings: PublicProfileSoldRow[] = soldRowsDb.map(({ listing }) => {
    const { soldAtLabel, settlement } = buildMockPublicProfileSoldParts({
      listingId: listing.id,
      updatedAt: listing.updatedAt,
      priceUsd: listing.priceUsd,
    });
    return { listingId: listing.id, soldAtLabel, settlement };
  });

  const name = profileDisplayName(user);
  const memberSince = memberSinceLabel(user.createdAt);
  const verified = user.orbVerified;
  const powerSeller = user.powerSeller;
  const avatarUrl =
    user.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.id)}`;
  const bio = `${name} sells on World Watch Trader.`;

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt={name}
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground">{name}</h1>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-world-verified/15 px-2 py-0.5 text-[10px] font-semibold text-world-verified">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                    <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm2.78 4.47a.5.5 0 0 0-.7-.7L5.5 6.29 4.42 5.22a.5.5 0 0 0-.7.7l1.6 1.6a.5.5 0 0 0 .7 0l3-3z" />
                  </svg>
                  World Verified
                </span>
              )}
              {powerSeller && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                    <path d="M6 .5a.5.5 0 0 1 .45.28l1.25 2.54 2.8.41a.5.5 0 0 1 .28.85L8.76 6.55l.51 2.79a.5.5 0 0 1-.72.53L6 8.6 3.45 9.87a.5.5 0 0 1-.72-.53l.51-2.79L1.22 4.58a.5.5 0 0 1 .28-.85l2.8-.41L5.55.78A.5.5 0 0 1 6 .5z" />
                  </svg>
                  Power Seller
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Member since {memberSince}</p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{bio}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{positiveRate}%</p>
            <p className="text-[10px] font-medium text-muted-foreground">Positive</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{sales}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Sales</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{verified ? '✓' : '—'}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Verified</p>
          </div>
        </div>

        <div className="mt-4">
          <Button className="w-full" asChild>
            <Link href="/design/messages">Message seller</Link>
          </Button>
        </div>
      </div>

      {activePreviewRows.length > 0 && (
        <PublicProfileActiveListings rows={activePreviewRows} listingsById={listingsById} />
      )}

      {soldListings.length > 0 && (
        <PublicProfileSoldListings rows={soldListings} listingsById={listingsById} />
      )}

      <div className="mx-4 mt-6 flex justify-end">
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Report user
        </button>
      </div>
    </div>
  );
}
