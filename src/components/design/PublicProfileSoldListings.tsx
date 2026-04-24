"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

import { FeedListingPreviewDrawer } from "@/components/design/FeedListingPreviewDrawer";
import { OnChainTxSheet } from "@/components/design/OnChainTxSheet";
import { getListingById, type Listing } from "@/lib/design/data";
import type { OnChainSettlement, PublicProfileSoldRow } from "@/lib/design/on-chain-sale-mock";
import { getListingChipThumbnailById } from "@/lib/design/listing-attachment-thumb";
import { useViewerDashboardListings } from "@/lib/design/use-viewer-dashboard-listings";

export function PublicProfileSoldListings({
  rows,
  listingsById,
  hideHeader = false,
  variant = 'sold',
}: {
  rows: PublicProfileSoldRow[];
  listingsById?: Record<string, Listing>;
  /** Skip the internal section header (used when rendered inside a tab panel). */
  hideHeader?: boolean;
  /** Whether these rows represent seller sales or buyer purchases. */
  variant?: 'sold' | 'purchased';
}) {
  const isSale = variant === 'sold';
  const verbPast = isSale ? 'Sold' : 'Purchased';
  const chipLabel = isSale ? 'Sale' : 'Purchase';
  const myListings = useViewerDashboardListings();
  const [listingDrawer, setListingDrawer] = useState<{
    listing: Listing;
    soldAtLabel: string;
  } | null>(null);
  const [txSheet, setTxSheet] = useState<OnChainSettlement | null>(null);

  const containerCls = isSale
    ? 'flex w-full items-center gap-3 rounded-xl border border-[#ffc85c] bg-[#ffc85c] p-3 text-left text-white shadow-sm transition-colors hover:bg-[#ffc85c]/90'
    : 'flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left text-foreground transition-colors hover:bg-white/90 dark:bg-card dark:text-foreground dark:hover:bg-card/80';

  const titleCls = isSale
    ? 'truncate text-sm font-semibold text-white'
    : 'truncate text-sm font-semibold text-foreground';

  const subCls = isSale ? 'text-xs text-white/80' : 'text-xs text-muted-foreground';

  const statusChipCls = isSale
    ? 'shrink-0 rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white'
    : 'shrink-0 rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground';

  const onChainChipCls = isSale
    ? 'inline-flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    : 'inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-emerald-100';

  return (
    <>
      <div className={hideHeader ? '' : 'mt-1 border-t border-border'}>
        {hideHeader ? null : (
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              {isSale
                ? `Sold listings (${rows.length})`
                : `Purchased listings (${rows.length})`}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isSale
                ? 'Escrow completed on-chain through the app.'
                : 'Purchases completed on-chain through the app.'}
            </p>
          </div>
        )}
        <div className="px-4 pt-4">
          <div className="space-y-2.5">
            {rows.map((row) => {
              const thumb = getListingChipThumbnailById(row.listingId, myListings, listingsById);
              const listing = listingsById?.[row.listingId] ?? getListingById(row.listingId);
              const title = listing?.model ?? 'Listing';
              const priceLine = listing ? `$${listing.price.toLocaleString('en-US')}` : '—';

              return (
                <button
                  key={`${row.listingId}-${row.settlement.txHash}`}
                  type="button"
                  onClick={() => {
                    const full = listingsById?.[row.listingId] ?? getListingById(row.listingId);
                    if (full) setListingDrawer({ listing: full, soldAtLabel: row.soldAtLabel });
                  }}
                  className={containerCls}
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
                    <p className={titleCls}>{title}</p>
                    <p className={subCls}>
                      {priceLine} · {verbPast} {row.soldAtLabel}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={statusChipCls}>{chipLabel}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTxSheet(row.settlement);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setTxSheet(row.settlement);
                        }
                      }}
                      aria-label="View on-chain transaction details"
                      className={onChainChipCls}
                    >
                      <Link2 className="size-3" />
                      On-chain
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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
