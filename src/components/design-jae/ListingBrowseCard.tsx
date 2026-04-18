'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';

import {
  listingCardPreviewImages,
  sellerDisplayInitials,
  type DummyListingCard,
} from '@/lib/design-jae-listings-dummy';
import { OrbVerifiedMark } from '@/components/design-jae/OrbVerifiedBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  listing: DummyListingCard;
};

function handleFromBadge(sellerBadge: string): string {
  return sellerBadge.replace(/^@/, '');
}

function forumPreviewText(listing: DummyListingCard): string {
  const priceLead = listing.price ? `${listing.price} · ` : 'Ask · ';
  return `${priceLead}${listing.title}. ${listing.teaser}`;
}

export function ListingBrowseCard({ listing }: Props) {
  const [liked, setLiked] = useState(false);
  const listingHref = `/design/jae/listings/${listing.id}`;
  const profileHref = `/design/u/${handleFromBadge(listing.sellerBadge)}`;
  const initials = sellerDisplayInitials(listing.sellerDisplayName);
  const forumPreview = forumPreviewText(listing);
  const previewImages = listingCardPreviewImages(listing);
  const heroImage = previewImages[0] ?? null;
  const sideImages = previewImages.slice(1, 3);
  const likeCount = listing.likeCount + (liked ? 1 : 0);

  return (
    <Card className="flex min-w-0 flex-col gap-0 overflow-hidden border border-black/5 bg-card py-0 shadow-[0_16px_40px_-18px_rgb(0_0_0_/_0.34),0_10px_18px_-12px_rgb(0_0_0_/_0.18)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-18px_rgb(0_0_0_/_0.38),0_14px_24px_-14px_rgb(0_0_0_/_0.2)] dark:border-white/10 dark:bg-card dark:shadow-[0_18px_42px_-18px_rgb(0_0_0_/_0.6),0_8px_18px_-10px_rgb(0_0_0_/_0.45)]">
      <div className="shrink-0 border-b border-black/10 bg-transparent dark:border-white/10">
        <Link
          href={profileHref}
          className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
        >
          <Avatar
            size="sm"
            className="size-10 shrink-0 bg-black/20 shadow-sm after:border-black/30 dark:bg-white/10 dark:after:border-white/20"
          >
            {listing.sellerAvatarUrl ? (
              <AvatarImage src={listing.sellerAvatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-black/15 text-xs text-foreground/80 dark:bg-white/10 dark:text-white/80">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-foreground">
                {listing.sellerDisplayName}
              </p>
              {listing.orbVerified ? (
                <OrbVerifiedMark className="size-6 min-h-6 min-w-6 shrink-0 ring-1 ring-background/80 shadow-sm [&>svg]:!size-3" />
              ) : null}
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-transparent bg-[#753C3B] text-[0.66rem] text-white hover:bg-[#753C3B]"
              >
                {listing.sellerSalesBadge}
              </Badge>
              <Badge
                variant="outline"
                className="border-transparent bg-[#AB7438] text-[0.66rem] text-white hover:bg-[#AB7438]"
              >
                {listing.sellerStatusBadge}
              </Badge>
              <span className="text-[0.68rem] leading-tight text-muted-foreground">{listing.postedAtLabel}</span>
            </div>
          </div>
        </Link>
      </div>

      <Link
        href={listingHref}
        className="flex min-w-0 flex-col text-left text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="shrink-0 border-b border-black/10 bg-transparent px-3 py-3 dark:border-white/10">
          <p
            className="text-[0.78rem] leading-5 text-foreground/90 sm:text-[0.82rem]"
            title={forumPreview}
          >
            <span className="line-clamp-5">{forumPreview}</span>
          </p>
        </div>

        <div className="grid aspect-[16/10] w-full grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-1 overflow-hidden bg-transparent p-1">
          <div className="relative overflow-hidden rounded-md bg-muted">
            {heroImage ? (
              <Image
                src={heroImage}
                alt=""
                fill
                className="rounded-md object-cover"
                sizes="(max-width: 768px) 70vw, 520px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                <span className="text-[0.65rem] font-medium text-muted-foreground">Photo soon</span>
              </div>
            )}
          </div>
          <div className="grid grid-rows-2 gap-1">
            {sideImages.map((src, index) => (
              <div key={`${listing.id}-preview-${index}`} className="relative overflow-hidden rounded-md bg-muted">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="rounded-md object-cover"
                  sizes="(max-width: 768px) 30vw, 220px"
                />
              </div>
            ))}
            {sideImages.length < 2
              ? Array.from({ length: 2 - sideImages.length }, (_, index) => (
                  <div
                    key={`${listing.id}-preview-fallback-${index}`}
                    className="flex items-center justify-center rounded-md bg-gradient-to-br from-muted to-muted-foreground/20"
                  >
                    <span className="text-[0.6rem] font-medium text-muted-foreground">More</span>
                  </div>
                ))
              : null}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t border-black/10 bg-transparent px-2 py-1.5 dark:border-white/10">
        <button
          type="button"
          onClick={() => setLiked((value) => !value)}
          className={cn(
            'flex h-9 flex-1 items-center justify-center gap-2 rounded-md text-[0.78rem] font-medium transition-colors',
            liked
              ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-300'
              : 'text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5',
          )}
          aria-pressed={liked}
          aria-label={`Like listing from ${listing.sellerDisplayName}`}
        >
          <Heart className={cn('size-4', liked ? 'fill-current' : '')} />
          <span>{likeCount}</span>
        </button>
        <Link
          href={listingHref}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md text-[0.78rem] font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/5"
          aria-label={`Open comments for ${listing.title}`}
        >
          <MessageCircle className="size-4" />
          <span>{listing.commentCount}</span>
        </Link>
      </div>
    </Card>
  );
}
