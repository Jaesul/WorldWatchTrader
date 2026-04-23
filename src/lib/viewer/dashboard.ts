import type { ListingStatus } from '@/db/schema';

import type { AppViewer } from './types';

export type ViewerDashboardListingJson = {
  id: string;
  title: string;
  priceUsd: number;
  status: ListingStatus;
  heroUrl: string | null;
  updatedAt: string;
  teaser: string;
  details: string;
  condition: string | null;
};

export type ViewerDashboardCursorJson = {
  updatedAt: string;
  id: string;
};

export type ViewerDashboardResponse = {
  viewer: AppViewer | null;
  listings: ViewerDashboardListingJson[];
  nextCursor: ViewerDashboardCursorJson | null;
};
