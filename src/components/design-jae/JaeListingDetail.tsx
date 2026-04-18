'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';

import type { DummyListingDetail } from '@/lib/design-jae-listings-dummy';
import { formatUsListingLocation, sellerDisplayInitials } from '@/lib/design-jae-listings-dummy';
import { ListingImageGallery } from '@/components/design-jae/ListingImageGallery';
import { OrbVerifiedMark } from '@/components/design-jae/OrbVerifiedBadge';
import { ListingPublicComments } from '@/components/design-jae/ListingPublicComments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

type Props = {
  listing: DummyListingDetail;
};

export function JaeListingDetail({ listing }: Props) {
  const [verified, setVerified] = useState(false);
  const profileHref = `/design/u/${listing.seller.handle}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0 border border-border/80 bg-muted/15">
        <Link
          href={profileHref}
          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 sm:px-4 sm:py-3"
        >
          <Avatar className="size-10 shrink-0 sm:size-11">
            <AvatarFallback className="text-sm">
              {sellerDisplayInitials(listing.seller.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate font-semibold text-foreground">{listing.seller.displayName}</p>
              {listing.orbVerified ? (
                <OrbVerifiedMark className="size-8 min-h-8 min-w-8 shrink-0 ring-1 ring-background shadow-sm sm:size-8 [&>svg]:!size-4" />
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">@{listing.seller.handle}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{listing.seller.hint}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </div>

      <ListingImageGallery alt={listing.title} heroUrl={listing.heroUrl} galleryUrls={listing.galleryUrls} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{listing.condition}</Badge>
          <Badge variant="outline">Ref. {listing.modelNumber}</Badge>
          <Badge variant="outline">{listing.caseSize}</Badge>
        </div>
        <h1 className="text-xl font-semibold leading-tight text-foreground">{listing.title}</h1>
        <p className="text-2xl font-medium tabular-nums text-foreground">{listing.price}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span>{formatUsListingLocation(listing.location)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          You pay network gas only — no app fee on this design stub.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/15 p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="design-verified" className="text-sm font-normal text-muted-foreground">
            Design only: simulate World ID verified
          </Label>
          <Switch id="design-verified" checked={verified} onCheckedChange={setVerified} />
        </div>
        {!verified ? (
          <Alert>
            <AlertTitle>Verify to buy</AlertTitle>
            <AlertDescription>
              World ID is required to purchase. In production this gate is enforced on the server.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button type="button" size="lg" className="w-full" disabled={!verified}>
            Pay seller
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            MiniKit pay sheet will open in the World App (wire-up later).
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-medium text-foreground">About this watch</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {listing.details}
        </p>
      </div>

      <Separator />

      <ListingPublicComments comments={listing.comments} />
    </div>
  );
}
