import { NextResponse } from 'next/server';

import { listSellerDashboardListingsPageWithHero } from '@/db/queries/listings';
import type { ListingStatus } from '@/db/schema';
import { getUserById } from '@/db/queries/users';
import type { ViewerDashboardResponse } from '@/lib/viewer/dashboard';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';
import { decodeSellerListingCursor, sellerCursorToJson } from '@/lib/viewer/dashboard-cursor';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

const empty: ViewerDashboardResponse = { viewer: null, listings: [], nextCursor: null };

export async function GET(req: Request) {
  const userId = await resolveDesignViewerUserId();

  if (!userId) {
    return NextResponse.json(empty);
  }

  const row = await getUserById(userId);
  if (!row) {
    return NextResponse.json(empty);
  }

  const { searchParams } = new URL(req.url);
  const limitParsed = Number.parseInt(searchParams.get('limit') ?? '15', 10);
  const limit = Number.isFinite(limitParsed)
    ? Math.min(100, Math.max(1, limitParsed))
    : 15;
  const cursor = decodeSellerListingCursor(searchParams.get('cursor'));

  const viewer = dbUserRowToAppViewer(row);
  const { rows, nextCursor } = await listSellerDashboardListingsPageWithHero(userId, limit, cursor);

  const listings = rows.map(({ listing, heroUrl }) => ({
    id: listing.id,
    title: listing.title,
    priceUsd: listing.priceUsd,
    status: listing.status as ListingStatus,
    heroUrl,
    updatedAt: listing.updatedAt.toISOString(),
    teaser: listing.teaser,
    details: listing.details ?? '',
    condition: listing.condition,
  }));

  return NextResponse.json({
    viewer,
    listings,
    nextCursor: sellerCursorToJson(nextCursor),
  } satisfies ViewerDashboardResponse);
}
