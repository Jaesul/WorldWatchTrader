import type { ListingStatus } from '@/db/schema';

import type { AppViewer } from './types';

export type ViewerDashboardDealParty = {
  id: string;
  username: string;
  handle: string | null;
  walletAddress: string;
  profilePictureUrl: string | null;
};

/** @deprecated Use {@link ViewerDashboardDealParty}. Kept as an alias for callers. */
export type ViewerDashboardDealBuyer = ViewerDashboardDealParty;

/** Compact shipment flag shown on profile history surfaces. No tracking digits. */
export type ViewerDashboardShipmentFlag = {
  carrierName: string;
  shippedAt: string | null;
};

export type ViewerDashboardDealSnapshot = {
  dealId: string;
  priceUsd: number;
  chainId: number;
  chainName: string;
  txHash: string | null;
  userOpHash: string | null;
  tokenSymbol: string;
  amountRaw: string;
  /** How the deal was executed (`minikit_pay`, `minikit_send_transaction`, `mock`, etc.). */
  executedWith: string | null;
  confirmedAt: string | null;
  /** Always populated for sale rows. For purchase rows this echoes the viewer. */
  buyer: ViewerDashboardDealParty;
  /** Populated for purchase rows; null for sale rows fetched from the seller dashboard. */
  seller: ViewerDashboardDealParty | null;
  /** Latest shipment attached to this deal, if any. */
  shipment: ViewerDashboardShipmentFlag | null;
  /** Buyer-submitted review tied to this completed transaction, if present. */
  review: {
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
};

/** Whether this row represents something the viewer sold or purchased. */
export type ViewerDashboardListingPerspective = 'sale' | 'purchase';

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
  deal: ViewerDashboardDealSnapshot | null;
  /** Defaults to 'sale' for seller-dashboard rows. */
  perspective?: ViewerDashboardListingPerspective;
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
