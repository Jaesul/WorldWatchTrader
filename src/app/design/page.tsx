'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Box,
  Clock3,
  Heart,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { LISTINGS, formatPrice, type Badge as ListingBadge, type Listing } from '@/lib/design/data';
import { cn } from '@/lib/utils';

function OrbIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M9.96783 18.9357C14.9206 18.9357 18.9357 14.9206 18.9357 9.96783C18.9357 5.01503 14.9206 1 9.96783 1C5.01503 1 1 5.01503 1 9.96783C1 14.9206 5.01503 18.9357 9.96783 18.9357Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M10.0406 10.5109C11.5667 10.5109 12.8038 9.27372 12.8038 7.74762C12.8038 6.22152 11.5667 4.98438 10.0406 4.98438C8.51449 4.98438 7.27734 6.22152 7.27734 7.74762C7.27734 9.27372 8.51449 10.5109 10.0406 10.5109Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M7.07422 13.9844H12.9767"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
    </svg>
  );
}

const BADGE_FILTERS: {
  key: ListingBadge | 'all';
  label: string;
  icon?: ComponentType<{ className?: string }>;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'world-verified', label: 'Verified', icon: OrbIcon },
  { key: 'power-seller', label: 'Power Seller', icon: Star },
];

const DRAWER_ANIMATION_MS = 300;

const SEARCH_RECOMMENDATIONS = [
  {
    title: 'Rolex Submariner Date',
    subtitle: 'Black dial, Oyster bracelet',
    query: 'Rolex Submariner Date',
  },
  {
    title: 'Rolex GMT-Master II Pepsi',
    subtitle: 'Blue and red bezel, Jubilee bracelet',
    query: 'Rolex GMT-Master II Pepsi',
  },
  {
    title: 'Rolex Daytona Panda',
    subtitle: 'White dial chronograph',
    query: 'Rolex Daytona Panda',
  },
  {
    title: 'Rolex Datejust 41 Wimbledon',
    subtitle: 'Slate Roman dial, fluted bezel',
    query: 'Rolex Datejust 41 Wimbledon',
  },
  {
    title: 'Rolex Explorer 40',
    subtitle: 'Black dial, brushed Oyster bracelet',
    query: 'Rolex Explorer 40',
  },
  {
    title: 'Rolex Day-Date 40 President',
    subtitle: 'Champagne dial, yellow gold',
    query: 'Rolex Day-Date 40 President',
  },
];

const BADGE_META: Record<
  ListingBadge,
  { label: string; icon?: LucideIcon; variant: 'brand' | 'outline'; className?: string }
> = {
  'world-verified': {
    label: 'World Verified',
    variant: 'brand',
  },
  'power-seller': {
    label: 'Power Seller',
    icon: Star,
    variant: 'outline',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
};

function BadgeChip({ badge }: { badge: ListingBadge }) {
  if (badge === 'world-verified') {
    return (
      <Badge
        variant="brand"
        className="size-6 rounded-full p-0 text-white"
        aria-label="World Verified"
      >
        <Image
          src="/orb.svg"
          alt=""
          width={12}
          height={12}
          className="size-4 brightness-0 invert"
          aria-hidden
        />
      </Badge>
    );
  }

  const { className, icon: Icon, label, variant } = BADGE_META[badge];

  return (
    <Badge
      variant={variant}
      className={cn('h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold', className)}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {label}
    </Badge>
  );
}

function SellerInitials({ name }: { name: string }) {
  const parts = name.split(' ');
  return <>{(parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()}</>;
}

type FakeComment = {
  id: string;
  author: string;
  body: string;
  timeLabel: string;
};

function buildFakeComments(listing: Listing): FakeComment[] {
  const variants = [
    {
      author: 'Marco K.',
      body: `Is the ${listing.model} still available, and are there any scratches on the clasp?`,
      timeLabel: '14m ago',
    },
    {
      author: 'Nina P.',
      body: `Love this one. ${listing.boxPapers} and ${listing.condition.toLowerCase()} makes it really compelling.`,
      timeLabel: '39m ago',
    },
    {
      author: 'Samir T.',
      body: `Would you consider a trade plus cash, or are you only looking for a straight sale?`,
      timeLabel: '1h ago',
    },
    {
      author: 'Jess A.',
      body: `Can you share a movement shot and maybe a quick lume photo in messages?`,
      timeLabel: '3h ago',
    },
    {
      author: 'Theo R.',
      body: `Price feels fair for a ${listing.condition.toLowerCase()} example. Curious how much traction you’ve had so far.`,
      timeLabel: '5h ago',
    },
  ];

  return variants.map((comment, index) => ({
    id: `${listing.id}-comment-${index + 1}`,
    ...comment,
  }));
}

function createInitialComments() {
  return Object.fromEntries(
    LISTINGS.map((listing) => [listing.id, buildFakeComments(listing)]),
  ) as Record<string, FakeComment[]>;
}

function commentInitials(name: string) {
  const parts = name.split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function CommentsDrawer({
  comments,
  listing,
  onAddComment,
  onClose,
}: {
  comments: FakeComment[];
  listing: Listing;
  onAddComment: (listingId: string, body: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [listing.id]);

  useEffect(() => {
    if (open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, DRAWER_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, onClose]);

  function submitComment() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddComment(listing.id, trimmed);
    setDraft('');
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto flex w-full max-w-lg flex-col rounded-t-2xl border-x px-0"
      >
        <SheetTitle className="sr-only">Comments for {listing.model}</SheetTitle>
        <SheetDescription className="sr-only">
          Public comments on {listing.model}
        </SheetDescription>
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="border-b px-5 pb-4 pt-2">
          <div className="mb-3 flex justify-end">
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close comments">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </div>

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">Comments</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{listing.model}</p>
            </div>
            <Badge variant="outline" className="gap-1 font-normal">
              <MessageCircle className="size-3" />
              {comments.length}
            </Badge>
          </div>
        </div>

        <div className="max-h-[55dvh] flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="gap-0 py-0 shadow-none">
                <CardHeader className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="bg-foreground text-background after:border-foreground/10">
                      <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                        {commentInitials(comment.author).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-sm font-semibold">{comment.author}</CardTitle>
                        <CardDescription className="text-xs">{comment.timeLabel}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm leading-relaxed text-foreground/85">{comment.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="border-t bg-background px-5 py-4">
          <div className="flex flex-col gap-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a public comment..."
              className="min-h-24 resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Comments are public on the listing thread.
              </p>
              <Button onClick={submitComment} disabled={!draft.trim()}>
                <MessageCircle className="size-4" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ListingDrawer({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [listing.id]);

  useEffect(() => {
    if (open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, DRAWER_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, onClose]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-lg rounded-t-2xl border-x px-0"
      >
        <SheetTitle className="sr-only">{listing.model}</SheetTitle>
        <SheetDescription className="sr-only">
          Listing details for @{listing.seller.handle}
        </SheetDescription>
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="max-h-[80dvh] overflow-y-auto px-5 pb-8 pt-2">
          <div className="mb-3 flex justify-end">
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close listing">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </div>

          <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
            <Image
              src={listing.photo}
              alt={listing.model}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <h2 className="mb-3 text-lg font-semibold leading-snug text-foreground">{listing.model}</h2>

          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-xl font-bold text-foreground">{formatPrice(listing.price)}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock3 className="size-4" />
              {listing.postedAt}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 font-normal">
              <ShieldCheck className="size-3" />
              {listing.condition}
            </Badge>
            <Badge variant="outline" className="gap-1 font-normal">
              <Box className="size-3" />
              {listing.boxPapers}
            </Badge>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-foreground/80">{listing.description}</p>

          <Card className="mb-5 gap-0 py-0 shadow-none">
            <Link
              href={`/design/u/${listing.seller.handle}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
            >
              <Avatar size="lg" className="bg-foreground text-background after:border-foreground/10">
                <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                  <SellerInitials name={listing.seller.name} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{listing.seller.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {listing.seller.badges.slice(0, 2).map((badge) => (
                    <BadgeChip key={badge} badge={badge} />
                  ))}
                </div>
              </div>
            </Link>
          </Card>

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link
                href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
                onClick={() => setOpen(false)}
              >
                <MessagesSquare className="size-4" />
                Reply to seller
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setLiked((value) => !value)}
              className={cn(
                'min-w-24',
                liked &&
                  'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/40',
              )}
            >
              <Heart className={cn('size-4', liked && 'fill-current')} />
              {listing.likes + (liked ? 1 : 0)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<ListingBadge | 'all'>('all');
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [openComments, setOpenComments] = useState<Listing | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsByListing, setCommentsByListing] = useState<Record<string, FakeComment[]>>(
    createInitialComments,
  );

  const suggestedSearches = SEARCH_RECOMMENDATIONS.filter((item) => {
    const haystack = `${item.title} ${item.subtitle}`.toLowerCase();
    return search.trim() === '' || haystack.includes(search.toLowerCase());
  }).slice(0, 5);

  const filtered = LISTINGS.filter((listing) => {
    const matchSearch =
      search.trim() === '' ||
      listing.model.toLowerCase().includes(search.toLowerCase()) ||
      listing.seller.name.toLowerCase().includes(search.toLowerCase());
    const matchBadge = badgeFilter === 'all' || listing.seller.badges.includes(badgeFilter);
    return matchSearch && matchBadge;
  });

  function toggleLike(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getCommentCount(id: string) {
    return commentsByListing[id]?.length ?? 0;
  }

  function addComment(listingId: string, body: string) {
    setCommentsByListing((prev) => {
      const nextComment: FakeComment = {
        id: `${listingId}-comment-${Date.now()}`,
        author: 'You',
        body,
        timeLabel: 'Just now',
      };

      return {
        ...prev,
        [listingId]: [...(prev[listingId] ?? []), nextComment],
      };
    });
  }

  return (
    <div className="bg-muted/30">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div
          className="relative mb-3"
          onBlur={() => {
            window.setTimeout(() => setSearchOpen(false), 100);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Rolex, brands, sellers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="h-10 rounded-full bg-muted/40 pl-9 pr-4"
          />

          {searchOpen && suggestedSearches.length > 0 ? (
            <Card className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 gap-0 overflow-hidden border-border/70 py-0 shadow-lg">
              <CardHeader className="px-3 py-2.5">
                <CardDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                  Suggested searches
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-1.5">
                <div className="flex flex-col">
                  {suggestedSearches.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearch(item.query);
                        setSearchOpen(false);
                      }}
                      className="flex items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="mt-0.5 rounded-full bg-muted p-1.5 text-muted-foreground">
                        <Search className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {BADGE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const active = badgeFilter === filter.key;

            return (
              <Button
                key={filter.key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBadgeFilter(filter.key)}
                className="shrink-0 rounded-full"
              >
                {Icon ? <Icon className="size-3.5" /> : null}
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {filtered.length === 0 ? (
          <Card className="py-0">
            <CardContent className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No listings found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((listing) => {
            const liked = likedIds.has(listing.id);
            const likeCount = listing.likes + (liked ? 1 : 0);
            const commentCount = getCommentCount(listing.id);

            return (
              <Card key={listing.id} className="gap-0 py-0 shadow-sm">
                <CardHeader className="border-b px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/design/u/${listing.seller.handle}`}
                      className="shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Avatar className="bg-foreground text-background after:border-foreground/10">
                        <AvatarFallback className="bg-foreground text-sm font-bold text-background">
                          <SellerInitials name={listing.seller.name} />
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/design/u/${listing.seller.handle}`}
                          className="text-sm font-semibold text-foreground hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {listing.seller.name}
                        </Link>
                        {listing.seller.badges.slice(0, 2).map((badge) => (
                          <BadgeChip key={badge} badge={badge} />
                        ))}
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-1 text-[11px]">
                        <Clock3 className="size-3" />
                        {listing.postedAt}
                      </CardDescription>
                    </div>

                    <Button variant="ghost" size="icon-sm" aria-label="More actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </CardHeader>

                <button
                  type="button"
                  className="relative w-full cursor-pointer overflow-hidden bg-muted text-left"
                  onClick={() => setOpenListing(listing)}
                  aria-label={`View ${listing.model}`}
                >
                  <div className="aspect-[4/3] w-full">
                    <Image
                      src={listing.photo}
                      alt={listing.model}
                      width={1200}
                      height={900}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>

                <CardContent className="px-4 pt-3 pb-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold leading-snug">{listing.model}</CardTitle>
                    <span className="shrink-0 text-base font-bold text-foreground">
                      {formatPrice(listing.price)}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1 font-normal">
                      <ShieldCheck className="size-3" />
                      {listing.condition}
                    </Badge>
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Box className="size-3" />
                      {listing.boxPapers}
                    </Badge>
                  </div>

                  <CardDescription className="text-sm leading-relaxed text-foreground/75">
                    <span className="line-clamp-2">{listing.description}</span>
                  </CardDescription>

                  <Button
                    variant="link"
                    className="mt-1 h-auto px-0 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpenListing(listing)}
                  >
                    See more
                  </Button>

                </CardContent>

                <CardFooter className="items-stretch bg-card p-0">
                  <Button
                    variant="ghost"
                    onClick={(event) => toggleLike(listing.id, event)}
                    aria-label={`${liked ? 'Unlike' : 'Like'} listing, ${likeCount} likes`}
                    className={cn(
                      'h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      liked && 'text-rose-500',
                    )}
                  >
                    <Heart className={cn('size-[18px]', liked && 'fill-current')} />
                    <span>{likeCount}</span>
                  </Button>

                  <Separator orientation="vertical" className="my-3 h-auto" />

                  <Button
                    variant="ghost"
                    onClick={() => setOpenComments(listing)}
                    aria-label={`Open ${commentCount} comments`}
                    className="h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  >
                    <MessageCircle className="size-[18px]" />
                    <span>{commentCount}</span>
                  </Button>

                  <Separator orientation="vertical" className="my-3 h-auto" />

                  <Button variant="ghost" asChild className="h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground">
                    <Link
                      href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
                      aria-label="Reply to seller"
                    >
                      <MessagesSquare className="size-[18px]" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {openListing ? (
        <ListingDrawer listing={openListing} onClose={() => setOpenListing(null)} />
      ) : null}
      {openComments ? (
        <CommentsDrawer
          listing={openComments}
          comments={commentsByListing[openComments.id] ?? []}
          onAddComment={addComment}
          onClose={() => setOpenComments(null)}
        />
      ) : null}
    </div>
  );
}
