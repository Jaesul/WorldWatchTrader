'use client';

import { useState } from 'react';
import { getListingById, type Listing } from '@/lib/design/data';
import { useViewerDashboardListings } from '@/lib/design/use-viewer-dashboard-listings';
import { getListingChipThumbnailById } from '@/lib/design/listing-attachment-thumb';
import { FeedListingPreviewDrawer } from '@/components/design/FeedListingPreviewDrawer';

export interface PublicProfileListingRow {
  id: string;
  model: string;
  price: string;
  condition: string;
  postedAt?: string;
}

export function PublicProfileActiveListings({
  rows,
  listingsById,
  hideHeader = false,
}: {
  rows: PublicProfileListingRow[];
  /** When set (e.g. DB-backed profile), drawer resolves UUID listings from this map instead of mock `LISTINGS`. */
  listingsById?: Record<string, Listing>;
  /** Skip the internal section header (used when rendered inside a tab panel). */
  hideHeader?: boolean;
}) {
  const myListings = useViewerDashboardListings();
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);

  return (
    <>
      <div>
        {hideHeader ? null : (
          <div className="border-b border-t border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Active listings ({rows.length})
            </h2>
          </div>
        )}
        <div className="px-4 pt-4">
          <div className="space-y-2.5">
            {rows.map((row) => {
              const thumb = getListingChipThumbnailById(
                row.id,
                myListings,
                listingsById,
              );
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    const full =
                      listingsById?.[row.id] ?? getListingById(row.id);
                    if (full) setDrawerListing(full);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-card/80"
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
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.price}
                      {row.condition ? ` · ${row.condition}` : ''}
                    </p>
                    {row.postedAt ? (
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        {row.postedAt}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <FeedListingPreviewDrawer
        listing={drawerListing}
        open={drawerListing !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerListing(null);
        }}
      />
    </>
  );
}
