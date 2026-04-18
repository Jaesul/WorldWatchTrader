'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LISTINGS, formatPrice } from '@/lib/design/data';
import { toggleSave } from '@/lib/design/interaction-store';
import { useSavedIds } from '@/lib/design/use-saved-ids';

export default function SavedPage() {
  const savedIds = useSavedIds();
  const savedListings = LISTINGS.filter((l) => savedIds.has(l.id)).sort((a, b) =>
    a.model.localeCompare(b.model),
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 pb-3 pt-5">
        <h1 className="text-xl font-semibold text-foreground">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {savedListings.length === 0
            ? 'Listings you bookmark from the feed appear here.'
            : `${savedListings.length} saved listing${savedListings.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {savedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-4 text-5xl">🔖</div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">No saved listings yet</h2>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Tap the bookmark on any listing in the feed to save it here. Saves sync across the app
            and stay until you remove them.
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
                <CardContent className="flex gap-3 p-3">
                  <Link
                    href="/design"
                    className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={listing.photos[0]}
                      alt={listing.model}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-foreground">{formatPrice(listing.price)}</p>
                    <Link
                      href="/design"
                      className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:underline"
                    >
                      {listing.model}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{listing.seller.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-8" asChild>
                        <Link href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}>
                          Message seller
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleSave(listing.id)}
                        aria-label="Remove from saved"
                      >
                        <Bookmark className="mr-1 size-4 fill-primary text-primary" />
                        Saved
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
