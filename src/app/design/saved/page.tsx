"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTINGS, formatPrice, type Listing } from "@/lib/design/data";
import { useSavedIds } from "@/lib/design/use-saved-ids";
import { FeedListingPreviewDrawer } from "@/components/design/FeedListingPreviewDrawer";

export default function SavedPage() {
  const savedIds = useSavedIds();
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);

  const savedListings = LISTINGS.filter((l) => savedIds.has(l.id)).sort(
    (a, b) => a.model.localeCompare(b.model),
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 pb-3 pt-5">
        <h1 className="text-xl font-semibold text-foreground">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {savedListings.length === 0
            ? "Listings you bookmark from the feed appear here."
            : `${savedListings.length} saved listing${savedListings.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {savedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-4 text-5xl">🔖</div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No saved listings yet
          </h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Tap the bookmark on any listing in the feed to save it here. Saves
            sync across the app and stay until you remove them.
          </p>
          <Button asChild>
            <Link href="/design">Browse listings</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 p-3">
          {savedListings.map((listing) => (
            <li key={listing.id}>
              <Card className="overflow-hidden py-0 shadow-sm">
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => setDrawerListing(listing)}
                    className="flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={listing.photos[0]}
                        alt={listing.model}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-foreground">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {listing.model}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {listing.seller.name}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="mt-1 size-4 shrink-0 self-center text-muted-foreground"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <FeedListingPreviewDrawer
        listing={drawerListing}
        open={drawerListing !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerListing(null);
        }}
      />
    </div>
  );
}
