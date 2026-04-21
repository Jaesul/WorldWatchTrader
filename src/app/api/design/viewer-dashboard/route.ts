import { NextResponse } from 'next/server';

import { listSellerDashboardListingsWithHero } from '@/db/queries/listings';
import type { ListingStatus } from '@/db/schema';
import { getUserById } from '@/db/queries/users';
import type { ViewerDashboardResponse } from '@/lib/viewer/dashboard';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

export async function GET() {
  const userId = await resolveDesignViewerUserId();

  const empty: ViewerDashboardResponse = { viewer: null, listings: [] };
  if (!userId) {
    return NextResponse.json(empty);
  }

  const row = await getUserById(userId);
  if (!row) {
    return NextResponse.json(empty);
  }

  const viewer = dbUserRowToAppViewer(row);
  const rows = await listSellerDashboardListingsWithHero(userId, 100);
  const listings = rows.map(({ listing, heroUrl }) => ({
    id: listing.id,
    title: listing.title,
    priceUsd: listing.priceUsd,
    status: listing.status as ListingStatus,
    heroUrl,
    updatedAt: listing.updatedAt.toISOString(),
    teaser: listing.teaser,
  }));

  return NextResponse.json({ viewer, listings } satisfies ViewerDashboardResponse);
}
