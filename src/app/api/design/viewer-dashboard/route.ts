import { NextResponse } from 'next/server';

import { getConfirmedDealsForListings } from '@/db/queries/dm-transactions';
import { mapDealReviewsByDealIds } from '@/db/queries/dm-reviews';
import { getShipmentFlagsForDealIds } from '@/db/queries/dm-shipments';
import { listSellerDashboardListingsPageWithHero } from '@/db/queries/listings';
import type { ListingStatus } from '@/db/schema';
import type {
  ViewerDashboardDealSnapshot,
  ViewerDashboardResponse,
} from '@/lib/viewer/dashboard';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';
import { decodeSellerListingCursor, sellerCursorToJson } from '@/lib/viewer/dashboard-cursor';
import { resolveDesignViewer } from '@/lib/server/resolve-design-viewer-user-id';

const empty: ViewerDashboardResponse = { viewer: null, listings: [], nextCursor: null };

export async function GET(req: Request) {
  const viewerRow = await resolveDesignViewer();
  if (!viewerRow) {
    return NextResponse.json(empty);
  }

  const { searchParams } = new URL(req.url);
  const limitParsed = Number.parseInt(searchParams.get('limit') ?? '15', 10);
  const limit = Number.isFinite(limitParsed)
    ? Math.min(100, Math.max(1, limitParsed))
    : 15;
  const cursor = decodeSellerListingCursor(searchParams.get('cursor'));

  const viewer = dbUserRowToAppViewer(viewerRow);
  const { rows, nextCursor } = await listSellerDashboardListingsPageWithHero(
    viewerRow.id,
    limit,
    cursor,
  );

  const soldIds = rows
    .filter(({ listing }) => listing.status === 'sold')
    .map(({ listing }) => listing.id);
  const dealByListing = await getConfirmedDealsForListings(soldIds);
  const dealIds = Array.from(dealByListing.values()).map((d) => d.id);
  const shipmentByDeal = await getShipmentFlagsForDealIds(dealIds);
  const reviewByDeal = await mapDealReviewsByDealIds(dealIds);

  const listings = rows.map(({ listing, heroUrl }) => {
    const deal = dealByListing.get(listing.id) ?? null;
    const shipmentFlag = deal ? shipmentByDeal.get(deal.id) ?? null : null;
    const dealSnapshot: ViewerDashboardDealSnapshot | null = deal
      ? {
          dealId: deal.id,
          priceUsd: deal.priceUsd,
          chainId: deal.chainId,
          chainName: deal.chainName,
          txHash: deal.transactionHash,
          userOpHash: deal.userOpHash,
          blockNumber: deal.blockNumber ?? null,
          tokenSymbol: deal.tokenSymbol,
          amountRaw: deal.amountRaw,
          confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
          buyer: {
            id: deal.buyer.id,
            username: deal.buyer.username,
            handle: deal.buyer.handle,
            walletAddress: deal.buyer.walletAddress,
            profilePictureUrl: deal.buyer.profilePictureUrl,
          },
          seller: null,
          shipment: shipmentFlag,
          review: reviewByDeal.get(deal.id) ?? null,
        }
      : null;
    return {
      id: listing.id,
      title: listing.title,
      priceUsd: listing.priceUsd,
      status: listing.status as ListingStatus,
      heroUrl,
      updatedAt: listing.updatedAt.toISOString(),
      teaser: listing.teaser,
      details: listing.details ?? '',
      condition: listing.condition,
      deal: dealSnapshot,
      perspective: 'sale' as const,
    };
  });

  return NextResponse.json({
    viewer,
    listings,
    nextCursor: sellerCursorToJson(nextCursor),
  } satisfies ViewerDashboardResponse);
}
