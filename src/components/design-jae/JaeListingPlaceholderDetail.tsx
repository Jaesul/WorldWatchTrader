import Link from 'next/link';

import type { DummyComment, DummyListingCard } from '@/lib/design-jae-listings-dummy';
import {
  FEATURED_LISTING_ID,
  formatUsListingLocation,
  sellerDisplayInitials,
} from '@/lib/design-jae-listings-dummy';
import { OrbVerifiedMark } from '@/components/design-jae/OrbVerifiedBadge';
import { MapPin } from 'lucide-react';
import { ListingPublicComments } from '@/components/design-jae/ListingPublicComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const EMPTY_COMMENTS: DummyComment[] = [];

type Props = {
  card: DummyListingCard;
};

function handleFromBadge(sellerBadge: string): string {
  return sellerBadge.replace(/^@/, '');
}

export function JaeListingPlaceholderDetail({ card }: Props) {
  const profileHref = `/design/u/${handleFromBadge(card.sellerBadge)}`;
  const initials = sellerDisplayInitials(card.sellerDisplayName);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0 border border-border/80 bg-muted/15">
        <Link
          href={profileHref}
          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 sm:px-4 sm:py-3"
        >
          <Avatar className="size-10 shrink-0 sm:size-11">
            {card.sellerAvatarUrl ? (
              <AvatarImage src={card.sellerAvatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate font-semibold text-foreground">{card.sellerDisplayName}</p>
              {card.orbVerified ? (
                <OrbVerifiedMark className="size-8 min-h-8 min-w-8 shrink-0 ring-1 ring-background shadow-sm [&>svg]:!size-4" />
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{card.sellerBadge}</p>
            {card.sellerHint ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.sellerHint}</p>
            ) : null}
          </div>
        </Link>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted-foreground/25 ring-1 ring-foreground/10" />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Design stub</Badge>
        </div>
        <h1 className="text-xl font-semibold leading-tight text-foreground">{card.title}</h1>
        {card.price ? (
          <p className="text-2xl font-medium tabular-nums text-foreground">{card.price}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Price on request</p>
        )}
        <p className="text-sm text-muted-foreground">{card.teaser}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span>{formatUsListingLocation(card.location)}</span>
        </p>
      </div>

      <p className="rounded-lg border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
        This listing uses placeholder layout in the sandbox. Open the sample Rolex for the full hero
        gallery, seller block, pay gate, and dummy comments.
      </p>

      <Link
        href={`/design/jae/listings/${FEATURED_LISTING_ID}`}
        className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full sm:w-fit')}
      >
        Open sample listing
      </Link>

      <Separator />

      <ListingPublicComments comments={EMPTY_COMMENTS} />
    </div>
  );
}
