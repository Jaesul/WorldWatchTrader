"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

import { FeedListingPreviewDrawer } from "@/components/design/FeedListingPreviewDrawer";
import { OnChainTxSheet } from "@/components/design/OnChainTxSheet";
import { Badge } from "@/components/ui/badge";
import { getListingById, type Listing } from "@/lib/design/data";
import type { OnChainSettlement, PublicProfileSoldRow } from "@/lib/design/on-chain-sale-mock";
import { getListingChipThumbnailById } from "@/lib/design/listing-attachment-thumb";
import { useViewerDashboardListings } from "@/lib/design/use-viewer-dashboard-listings";

export function PublicProfileSoldListings({ rows }: { rows: PublicProfileSoldRow[] }) {
  const myListings = useViewerDashboardListings();
  const [listingDrawer, setListingDrawer] = useState<{
    listing: Listing;
    soldAtLabel: string;
  } | null>(null);
  const [txSheet, setTxSheet] = useState<OnChainSettlement | null>(null);

  return (
    <>
      <div className="mt-1 border-t border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Sold listings ({rows.length})
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Escrow completed on-chain through the app.
          </p>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const thumb = getListingChipThumbnailById(row.listingId, myListings);
            const listing = getListingById(row.listingId);
            const title = listing?.model ?? "Listing";
            const priceLine = listing ? `$${listing.price.toLocaleString("en-US")}` : "—";

            return (
              <div
                key={`${row.listingId}-${row.settlement.txHash}`}
                className="flex items-center gap-2 px-4 py-3.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    const full = getListingById(row.listingId);
                    if (full) setListingDrawer({ listing: full, soldAtLabel: row.soldAtLabel });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="size-12 shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                      ⌚
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {priceLine} · Sold {row.soldAtLabel}
                    </p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setTxSheet(row.settlement)}
                  className="shrink-0 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="View on-chain transaction details"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer gap-1 border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-100"
                  >
                    <Link2 className="size-3" />
                    On-chain
                  </Badge>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <FeedListingPreviewDrawer
        listing={listingDrawer?.listing ?? null}
        open={listingDrawer !== null}
        onOpenChange={(open) => {
          if (!open) setListingDrawer(null);
        }}
        soldHistory={
          listingDrawer
            ? { soldAtLabel: listingDrawer.soldAtLabel }
            : undefined
        }
      />

      <OnChainTxSheet
        settlement={txSheet}
        open={txSheet !== null}
        onOpenChange={(open) => {
          if (!open) setTxSheet(null);
        }}
      />
    </>
  );
}
