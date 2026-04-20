'use client';

import { useState } from 'react';
import { getListingById, type Listing } from '@/lib/design/data';
import { useMyListings } from '@/lib/design/use-my-listings';
import { getListingChipThumbnailById } from '@/lib/design/listing-attachment-thumb';
import { FeedListingPreviewDrawer } from '@/components/design/FeedListingPreviewDrawer';

export interface PublicProfileListingRow {
  id: string;
  model: string;
  price: string;
  condition: string;
}

export function PublicProfileActiveListings({
  rows,
}: {
  rows: PublicProfileListingRow[];
}) {
  const myListings = useMyListings();
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);

  return (
    <>
      <div>
        <div className="border-b border-t border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Active listings ({rows.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const thumb = getListingChipThumbnailById(row.id, myListings);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  const full = getListingById(row.id);
                  if (full) setDrawerListing(full);
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/20"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="size-12 shrink-0 rounded-lg object-cover bg-muted" />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{row.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.price} · {row.condition}
                  </p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4 shrink-0 text-muted-foreground">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      <FeedListingPreviewDrawer
        listing={drawerListing}
        open={drawerListing !== null}
        onOpenChange={(open) => { if (!open) setDrawerListing(null); }}
      />
    </>
  );
}
