import { listActiveListingsWithSellerAndPhotos } from '@/db/queries/listings';
import { mapDbFeedToDesignListings } from '@/lib/design/map-db-feed-to-listing';

import { DesignMarketplaceClient } from './DesignMarketplaceClient';

export default async function DesignMarketplacePage() {
  const rows = await listActiveListingsWithSellerAndPhotos(24);
  const initialListings = mapDbFeedToDesignListings(rows);

  return <DesignMarketplaceClient initialListings={initialListings} />;
}
