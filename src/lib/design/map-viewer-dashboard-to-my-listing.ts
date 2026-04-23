import type { ViewerDashboardListingJson } from '@/lib/viewer/dashboard';
import { formatPublishedAtLabel } from '@/lib/design/map-db-feed-to-listing';
import {
  descriptionFromListingDetails,
  parseBoxPapersFromDetails,
} from '@/lib/design/listing-details-parse';

import type { MyListing } from '@/lib/design/listing-store';

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1611243705491-71487c2ed137?auto=format&fit=crop&w=800&q=80';

export function viewerDashboardRowToMyListing(row: ViewerDashboardListingJson): MyListing {
  const updated = new Date(row.updatedAt);
  const status: MyListing['status'] =
    row.status === 'draft' || row.status === 'active' || row.status === 'pending'
      ? row.status
      : row.status === 'sold'
        ? 'sold'
        : 'archived';

  const details = row.details;
  const body = descriptionFromListingDetails(details);
  const description =
    body || (row.teaser?.trim() ? row.teaser : '');

  return {
    id: row.id,
    model: row.title,
    price: row.priceUsd,
    currency: 'USD',
    description,
    condition: row.condition ?? '',
    boxPapers: parseBoxPapersFromDetails(details),
    photoCount: row.heroUrl ? 1 : 0,
    photo: row.heroUrl ?? FALLBACK_PHOTO,
    status,
    postedAt: formatPublishedAtLabel(updated),
  };
}
