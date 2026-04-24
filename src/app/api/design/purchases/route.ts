import { NextResponse } from 'next/server';

import { listPurchasesForUser } from '@/db/queries/dm-transactions';
import { getShipmentFlagsForDealIds } from '@/db/queries/dm-shipments';
import type { ListingStatus } from '@/db/schema';
import type {
  ViewerDashboardDealSnapshot,
  ViewerDashboardListingJson,
} from '@/lib/viewer/dashboard';
import { resolveDesignViewer } from '@/lib/server/resolve-design-viewer-user-id';

export async function GET() {
  const viewerRow = await resolveDesignViewer();
  if (!viewerRow) {
    return NextResponse.json({ listings: [] });
  }

  const rows = await listPurchasesForUser(viewerRow.id, 100);
  const shipmentByDeal = await getShipmentFlagsForDealIds(
    rows.map((r) => r.deal.id),
  );

  const listings: ViewerDashboardListingJson[] = rows.map(
    ({ listing, deal, seller, heroUrl }) => {
      const shipmentFlag = shipmentByDeal.get(deal.id) ?? null;
      const dealSnapshot: ViewerDashboardDealSnapshot = {
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
          id: viewerRow.id,
          username: viewerRow.username,
          handle: viewerRow.handle,
          walletAddress: viewerRow.walletAddress,
          profilePictureUrl: viewerRow.profilePictureUrl,
        },
        seller: {
          id: seller.id,
          username: seller.username,
          handle: seller.handle,
          walletAddress: seller.walletAddress,
          profilePictureUrl: seller.profilePictureUrl,
        },
        shipment: shipmentFlag,
      };
      return {
        id: listing.id,
        title: listing.title,
        priceUsd: listing.priceUsd,
        status: listing.status as ListingStatus,
        heroUrl,
        updatedAt: (deal.confirmedAt ?? listing.updatedAt).toISOString(),
        teaser: listing.teaser,
        details: listing.details ?? '',
        condition: listing.condition,
        deal: dealSnapshot,
        perspective: 'purchase' as const,
      };
    },
  );

  return NextResponse.json({ listings });
}
