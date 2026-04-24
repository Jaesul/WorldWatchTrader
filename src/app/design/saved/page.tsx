"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/design/data";
import { useDesignListingSaves } from "@/lib/design/use-design-listing-saves";
import type { DesignFeedListing } from "@/lib/design/map-db-feed-to-listing";
import { FeedListingPreviewDrawer } from "@/components/design/FeedListingPreviewDrawer";

function SavedListingSkeleton() {
  return (
    <Card className="overflow-hidden py-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex w-full gap-3 p-3">
          <Skeleton className="aspect-[4/3] w-28 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full max-w-[220px]" />
            <Skeleton className="h-4 w-4/5 max-w-[180px]" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-1 size-4 shrink-0 self-center rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SavedPage() {
  const { savedListings, loading } = useDesignListingSaves();
  const [drawerListing, setDrawerListing] = useState<DesignFeedListing | null>(
    null,
  );

  const sorted = useMemo(
    () =>
      [...savedListings].sort((a, b) =>
        a.model.localeCompare(b.model, undefined, { sensitivity: "base" }),
      ),
    [savedListings],
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 pb-3">
        <h1 className="text-xl font-semibold text-foreground">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? "Loading…"
            : sorted.length === 0
              ? "Listings you bookmark from the feed appear here."
              : `${sorted.length} saved listing${sorted.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SavedListingSkeleton key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-4 text-5xl">🔖</div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            No saved listings yet
          </h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Tap the bookmark on any listing in the feed to save it here. Saves
            are stored for the profile you pick in Design.
          </p>
          <Button asChild>
            <Link href="/design">Browse listings</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 p-3">
          {sorted.map((listing) => (
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
