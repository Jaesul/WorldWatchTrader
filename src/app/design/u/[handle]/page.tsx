import { notFound } from 'next/navigation';

import type { PublicProfileListingRow } from '@/components/design/PublicProfileActiveListings';
import { CopyWalletButton } from '@/components/design/CopyWalletButton';
import { ProfileChatShareButton } from '@/components/design/ProfileChatShareButton';
import { PublicProfileListingsTabs } from '@/components/design/PublicProfileListingsTabs';
import { WorldOrbIcon } from '@/components/icons/world-orb';
import { Button } from '@/components/ui/button';
import { RoutedLink } from '@/lib/route-mode/RoutedLink';
import {
  countSellerListingsByStatus,
  listSellerListingsWithPhotosByStatus,
} from '@/db/queries/listings';
import {
  getConfirmedDealsForListings,
  listPurchasesForUser,
  type PurchaseRow,
} from '@/db/queries/dm-transactions';
import { mapDealReviewsByDealIds } from '@/db/queries/dm-reviews';
import { getShipmentFlagsForDealIds } from '@/db/queries/dm-shipments';
import { getUserByPublicProfileSlug } from '@/db/queries/users';
import type { Badge, Listing } from '@/lib/design/data';
import {
  formatPublishedAtLabel,
  mapHomeRowToDesignListing,
  sellerPublicProfileSlug,
} from '@/lib/design/map-db-feed-to-listing';
import {
  descriptionFromListingDetails,
  parseBoxPapersFromDetails,
} from '@/lib/design/listing-details-parse';
import {
  buildMockPublicProfileSoldParts,
  type OnChainSettlement,
  type PublicProfileSoldRow,
} from '@/lib/design/on-chain-sale-mock';
import { buildReceiptOnChainSettlement } from '@/lib/settlement/receipt-settlement';
import {
  memberSinceLabel,
  profileDisplayName,
  publicProfileSalesAndPositivePercent,
} from '@/lib/design/public-profile-stats';
import { getSellerReviewSummary } from '@/db/queries/dm-reviews';
import type {
  ViewerDashboardDealParty,
  ViewerDashboardDealSnapshot,
  ViewerDashboardShipmentFlag,
} from '@/lib/viewer/dashboard';

export const revalidate = 60;

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?u=unknown-seller';
const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1611243705491-71487c2ed137?auto=format&fit=crop&w=800&q=80';

function priceChip(listing: Listing): string {
  return `$${listing.price.toLocaleString('en-US')}`;
}

function mapPurchaseRowToDesignListing(row: PurchaseRow): Listing {
  const { listing, seller, heroUrl } = row;
  const details = listing.details ?? '';
  const publishedAt = listing.publishedAt ?? listing.updatedAt;
  const badges: Badge[] = [];
  if (seller.orbVerified) badges.push('world-verified');
  if (seller.powerSeller) badges.push('power-seller');
  return {
    id: listing.id,
    model: listing.title,
    price: listing.priceUsd,
    description: descriptionFromListingDetails(details),
    condition: listing.condition ?? '',
    boxPapers: parseBoxPapersFromDetails(details),
    postedAt: formatPublishedAtLabel(publishedAt),
    likes: 0,
    seller: {
      name: seller.username,
      handle: sellerPublicProfileSlug(seller),
      badges,
      avatar: seller.profilePictureUrl ?? PLACEHOLDER_AVATAR,
    },
    photos: heroUrl ? [heroUrl] : [FALLBACK_HERO],
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const slug = decodeURIComponent((await params).handle);
  const user = await getUserByPublicProfileSlug(slug);
  if (!user) notFound();

  const [soldCountFromDb, reviewSummary] = await Promise.all([
    countSellerListingsByStatus(user.id, 'sold'),
    getSellerReviewSummary(user.id),
  ]);
  const { sales, positiveRate } = publicProfileSalesAndPositivePercent({
    username: user.username,
    handle: user.handle,
    soldCountFromDb,
    totalReviews: reviewSummary.totalReviews,
    positiveReviews: reviewSummary.positiveReviews,
  });

  const [activeRows, soldRowsDb, purchaseRowsDb] = await Promise.all([
    listSellerListingsWithPhotosByStatus(user.id, 'active', 100),
    listSellerListingsWithPhotosByStatus(user.id, 'sold', 100),
    listPurchasesForUser(user.id, 100),
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
  for (const row of purchaseRowsDb) {
    const l = mapPurchaseRowToDesignListing(row);
    listingsById[l.id] = l;
  }

  const activePreviewRows: PublicProfileListingRow[] = activeRows.map((row) => {
    const l = mapHomeRowToDesignListing(row);
    return {
      id: l.id,
      model: l.model,
      price: priceChip(l),
      condition: l.condition || '—',
      postedAt: l.postedAt,
    };
  });

  const soldListingIds = soldRowsDb.map(({ listing }) => listing.id);
  const confirmedDeals = await getConfirmedDealsForListings(soldListingIds);

  const dealIdsForShipments: string[] = [];
  for (const deal of confirmedDeals.values()) dealIdsForShipments.push(deal.id);
  for (const { deal } of purchaseRowsDb) dealIdsForShipments.push(deal.id);
  const shipmentFlagsByDealId = await getShipmentFlagsForDealIds(dealIdsForShipments);
  const reviewByDealId = await mapDealReviewsByDealIds(dealIdsForShipments);

  const profileOwnerParty: ViewerDashboardDealParty = {
    id: user.id,
    username: user.username,
    handle: user.handle,
    walletAddress: user.walletAddress,
    profilePictureUrl: user.profilePictureUrl,
  };

  const soldListings: PublicProfileSoldRow[] = soldRowsDb.map(({ listing }) => {
    const fallback = buildMockPublicProfileSoldParts({
      listingId: listing.id,
      updatedAt: listing.updatedAt,
      priceUsd: listing.priceUsd,
    });
    const deal = confirmedDeals.get(listing.id);
    if (!deal) {
      return {
        listingId: listing.id,
        soldAtLabel: fallback.soldAtLabel,
        settlement: fallback.settlement,
        perspective: 'sale' as const,
      };
    }
    const confirmedDate = deal.confirmedAt ?? listing.updatedAt;
    const soldAtLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(confirmedDate);
    const confirmedAtLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(confirmedDate);
    const settlement = buildReceiptOnChainSettlement(
      {
        txHash: deal.transactionHash,
        userOpHash: deal.userOpHash,
        chainName: deal.chainName,
        tokenSymbol: deal.tokenSymbol,
        amountRaw: deal.amountRaw,
        executedWith: deal.executedWith ?? null,
      },
      fallback.settlement,
      confirmedAtLabel,
    );
    const buyerParty: ViewerDashboardDealParty = {
      id: deal.buyer.id,
      username: deal.buyer.username,
      handle: deal.buyer.handle,
      walletAddress: deal.buyer.walletAddress,
      profilePictureUrl: deal.buyer.profilePictureUrl,
    };
    const shipmentRow = shipmentFlagsByDealId.get(deal.id) ?? null;
    const shipment: ViewerDashboardShipmentFlag | null = shipmentRow
      ? { carrierName: shipmentRow.carrierName, shippedAt: shipmentRow.shippedAt }
      : null;
    const dealSnapshot: ViewerDashboardDealSnapshot = {
      dealId: deal.id,
      priceUsd: deal.priceUsd,
      chainId: deal.chainId,
      chainName: deal.chainName,
      txHash: deal.transactionHash,
      userOpHash: deal.userOpHash,
      tokenSymbol: deal.tokenSymbol,
      amountRaw: deal.amountRaw,
      executedWith: deal.executedWith ?? null,
      confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
      buyer: buyerParty,
      seller: null,
      shipment,
      review: reviewByDealId.get(deal.id) ?? null,
    };
    return {
      listingId: listing.id,
      soldAtLabel,
      settlement,
      perspective: 'sale' as const,
      deal: dealSnapshot,
    };
  });

  const purchasedListings: PublicProfileSoldRow[] = purchaseRowsDb.map(
    ({ listing, deal, seller }) => {
      const fallback = buildMockPublicProfileSoldParts({
        listingId: listing.id,
        updatedAt: listing.updatedAt,
        priceUsd: listing.priceUsd,
      });
      const confirmedDate = deal.confirmedAt ?? listing.updatedAt;
      const soldAtLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
      }).format(confirmedDate);
      const confirmedAtLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(confirmedDate);
      const settlement = buildReceiptOnChainSettlement(
        {
          txHash: deal.transactionHash,
          userOpHash: deal.userOpHash,
          chainName: deal.chainName,
          tokenSymbol: deal.tokenSymbol,
          amountRaw: deal.amountRaw,
          executedWith: deal.executedWith ?? null,
        },
        fallback.settlement,
        confirmedAtLabel,
      );
      const sellerParty: ViewerDashboardDealParty = {
        id: seller.id,
        username: seller.username,
        handle: seller.handle,
        walletAddress: seller.walletAddress,
        profilePictureUrl: seller.profilePictureUrl,
      };
      const shipmentRow = shipmentFlagsByDealId.get(deal.id) ?? null;
      const shipment: ViewerDashboardShipmentFlag | null = shipmentRow
        ? { carrierName: shipmentRow.carrierName, shippedAt: shipmentRow.shippedAt }
        : null;
      const dealSnapshot: ViewerDashboardDealSnapshot = {
        dealId: deal.id,
        priceUsd: deal.priceUsd,
        chainId: deal.chainId,
        chainName: deal.chainName,
        txHash: deal.transactionHash,
        userOpHash: deal.userOpHash,
        tokenSymbol: deal.tokenSymbol,
        amountRaw: deal.amountRaw,
        executedWith: deal.executedWith ?? null,
        confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
        buyer: profileOwnerParty,
        seller: sellerParty,
        shipment,
        review: reviewByDealId.get(deal.id) ?? null,
      };
      return {
        listingId: listing.id,
        soldAtLabel,
        settlement,
        perspective: 'purchase' as const,
        deal: dealSnapshot,
      };
    },
  );

  const name = profileDisplayName(user);
  const hasReviewData = reviewSummary.totalReviews > 0;
  const memberSince = memberSinceLabel(user.createdAt);
  const verified = user.orbVerified;
  const powerSeller = user.powerSeller;
  const avatarUrl =
    user.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.id)}`;
  const bio = `${name} sells on World Watch Trader.`;

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="px-4 pb-4 pt-0">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt={name}
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground">{name}</h1>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              {user.handle && user.handle !== user.username ? (
                <>
                  <span className="truncate">@{user.handle}</span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <CopyWalletButton address={user.walletAddress} />
              <ProfileChatShareButton profileSlug={slug} username={user.username} />
            </div>
            {(verified || powerSeller) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-world-verified/15 px-2 py-0.5 text-[10px] font-semibold text-world-verified">
                    <WorldOrbIcon className="size-3 shrink-0" />
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
            )}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{bio}</p>

        <dl className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Active listings</dt>
            <dd className="text-sm font-semibold text-foreground">
              {activePreviewRows.length}
            </dd>
            <span>active</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Sales</dt>
            <dd className="text-sm font-semibold text-foreground">{sales}</dd>
            <span>{sales === 1 ? 'sale' : 'sales'}</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Purchases</dt>
            <dd className="text-sm font-semibold text-foreground">
              {purchasedListings.length}
            </dd>
            <span>{purchasedListings.length === 1 ? 'purchase' : 'purchases'}</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Positive feedback</dt>
            <dd className="text-sm font-semibold text-foreground">
              {hasReviewData ? `${positiveRate}%` : '--'}
            </dd>
            <span>positive</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Member since</dt>
            <dd>Joined {memberSince}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <Button className="w-full text-white" asChild>
            <RoutedLink to="/messages">Message seller</RoutedLink>
          </Button>
        </div>
      </div>

      {activePreviewRows.length > 0 ||
      soldListings.length > 0 ||
      purchasedListings.length > 0 ? (
        <PublicProfileListingsTabs
          activeRows={activePreviewRows}
          soldRows={soldListings}
          purchasedRows={purchasedListings}
          listingsById={listingsById}
        />
      ) : null}

      <div className="mx-4 mt-6 flex justify-end">
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Report user
        </button>
      </div>
    </div>
  );
}
