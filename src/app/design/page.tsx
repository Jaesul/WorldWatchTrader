'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  Reply,
  MoreHorizontal,
  Search,
  Send,
  Star,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LISTINGS, formatPrice, type Badge as ListingBadge, type Listing } from '@/lib/design/data';
import { toggleSave as toggleSaveListing } from '@/lib/design/interaction-store';
import { useSavedIds } from '@/lib/design/use-saved-ids';
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

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest';

function parsePostedAtMinutes(s: string): number {
  const h = s.match(/^(\d+)h/);
  const d = s.match(/^(\d+)d/);
  if (h) return parseInt(h[1]) * 60;
  if (d) return parseInt(d[1]) * 1440;
  return 0;
}

const SELLER_FILTER_BADGES = [
  ...new Set(
    LISTINGS.flatMap((l) => l.seller.badges).filter((b): b is ListingBadge => b !== 'world-verified'),
  ),
];

const SELLER_BADGE_LABEL: Partial<Record<ListingBadge, string>> = {
  'power-seller': 'Power Seller',
};

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
      'border-primary/40 bg-primary/10 text-primary',
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

function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || photos.length <= 1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveIdx(Number((entry.target as HTMLElement).dataset.idx));
          }
        }
      },
      { root: container, threshold: 0.6 },
    );
    container.querySelectorAll('[data-idx]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [photos.length]);

  function scrollTo(idx: number) {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: idx * container.offsetWidth, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photos.map((src, i) => (
          <div key={i} data-idx={i} className="aspect-[4/3] w-full shrink-0 snap-start">
            <Image
              src={src}
              alt={`${alt} — ${i + 1} of ${photos.length}`}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          {activeIdx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scrollTo(activeIdx - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          {activeIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scrollTo(activeIdx + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Next photo"
            >
              <ChevronRight className="size-4" />
            </button>
          )}

          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {activeIdx + 1}/{photos.length}
          </span>

          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
                className={cn(
                  'size-1.5 rounded-full transition-all',
                  i === activeIdx ? 'scale-125 bg-white' : 'bg-white/50',
                )}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type FakeComment = {
  id: string;
  author: string;
  avatar: string;
  body: string;
  timeLabel: string;
  likes: number;
};

function buildFakeComments(listing: Listing): FakeComment[] {
  const variants = [
    {
      author: 'Marco K.',
      avatar: 'https://i.pravatar.cc/150?u=marco-k',
      body: `Is the ${listing.model} still available, and are there any scratches on the clasp?`,
      timeLabel: '14m ago',
      likes: 7,
    },
    {
      author: 'Nina P.',
      avatar: 'https://i.pravatar.cc/150?u=nina-p',
      body: `Love this one. ${listing.boxPapers} and ${listing.condition.toLowerCase()} makes it really compelling.`,
      timeLabel: '39m ago',
      likes: 12,
    },
    {
      author: 'Samir T.',
      avatar: 'https://i.pravatar.cc/150?u=samir-t',
      body: `Would you consider a trade plus cash, or are you only looking for a straight sale?`,
      timeLabel: '1h ago',
      likes: 4,
    },
    {
      author: 'Jess A.',
      avatar: 'https://i.pravatar.cc/150?u=jess-a',
      body: `Can you share a movement shot and maybe a quick lume photo in messages?`,
      timeLabel: '3h ago',
      likes: 9,
    },
    {
      author: 'Theo R.',
      avatar: 'https://i.pravatar.cc/150?u=theo-r',
      body: `Price feels fair for a ${listing.condition.toLowerCase()} example. Curious how much traction you’ve had so far.`,
      timeLabel: '5h ago',
      likes: 3,
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

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  const [sellerBadgeFilter, setSellerBadgeFilter] = useState<ListingBadge | null>(null);
  const [worldVerified, setWorldVerified] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const savedIds = useSavedIds();
  const [commentsByListing, setCommentsByListing] = useState<Record<string, FakeComment[]>>(
    createInitialComments,
  );
  const [commentLikedIds, setCommentLikedIds] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedDescIds, setExpandedDescIds] = useState<Set<string>>(new Set());
  const [expandedCommentsIds, setExpandedCommentsIds] = useState<Set<string>>(new Set());

  const suggestedSearches = SEARCH_RECOMMENDATIONS.filter((item) => {
    const haystack = `${item.title} ${item.subtitle}`.toLowerCase();
    return search.trim() === '' || haystack.includes(search.toLowerCase());
  }).slice(0, 5);

  const hasFilters = sortBy !== null || sellerBadgeFilter !== null || worldVerified;
  const hasNonVerifiedFilters = sortBy !== null || sellerBadgeFilter !== null;

  function clearFilters() {
    setSortBy(null);
    setSellerBadgeFilter(null);
    setWorldVerified(false);
    setFilterOpen(false);
  }

  const filtered = LISTINGS.filter((listing) => {
    const matchSearch =
      search.trim() === '' ||
      listing.model.toLowerCase().includes(search.toLowerCase()) ||
      listing.seller.name.toLowerCase().includes(search.toLowerCase());
    const matchVerified = !worldVerified || listing.seller.badges.includes('world-verified');
    const matchBadge = !sellerBadgeFilter || listing.seller.badges.includes(sellerBadgeFilter);
    return matchSearch && matchVerified && matchBadge;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return parsePostedAtMinutes(a.postedAt) - parsePostedAtMinutes(b.postedAt);
    if (sortBy === 'oldest') return parsePostedAtMinutes(b.postedAt) - parsePostedAtMinutes(a.postedAt);
    return 0;
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

  function addComment(listingId: string) {
    const body = (commentDrafts[listingId] ?? '').trim();
    if (!body) return;
    setCommentsByListing((prev) => {
      const nextComment: FakeComment = {
        id: `${listingId}-comment-${Date.now()}`,
        author: 'You',
        avatar: 'https://i.pravatar.cc/150?u=me-user',
        body,
        timeLabel: 'Just now',
        likes: 0,
      };
      return { ...prev, [listingId]: [...(prev[listingId] ?? []), nextComment] };
    });
    setCommentDrafts((prev) => ({ ...prev, [listingId]: '' }));
  }

  function toggleCommentLike(commentId: string) {
    setCommentLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId); else next.add(commentId);
      return next;
    });
  }

  function handleSaveListing(listingId: string, event: React.MouseEvent) {
    event.stopPropagation();
    toggleSaveListing(listingId);
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

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {/* Clear filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="shrink-0 rounded-full"
            aria-label="Clear all filters"
          >
            <X className="size-3.5" />
          </Button>

          {/* Funnel button + expanding filter controls */}
          <Button
            variant={filterOpen || hasNonVerifiedFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOpen((v) => !v)}
            className="shrink-0 rounded-full"
            aria-label="Toggle filters"
            aria-expanded={filterOpen}
          >
            <Filter className="size-3.5" />
          </Button>

          <div
            className={cn(
              'flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out',
              filterOpen ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 pointer-events-none',
            )}
          >
            <select
              value={sortBy ?? ''}
              onChange={(e) => setSortBy((e.target.value as SortOption) || null)}
              className="h-8 shrink-0 cursor-pointer appearance-none rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sort by</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            {SELLER_FILTER_BADGES.map((badge) => (
              <Button
                key={badge}
                variant={sellerBadgeFilter === badge ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSellerBadgeFilter(sellerBadgeFilter === badge ? null : badge)}
                className="shrink-0 rounded-full"
              >
                <Star className="size-3.5" />
                {SELLER_BADGE_LABEL[badge] ?? badge}
              </Button>
            ))}
          </div>

          {/* World Verified — standalone, multi-selects with funnel filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWorldVerified((v) => !v)}
            className={cn(
              'shrink-0 rounded-full',
              worldVerified &&
                'border-world-verified bg-world-verified text-world-verified-foreground hover:bg-world-verified/90 hover:text-world-verified-foreground',
            )}
          >
            <OrbIcon className="size-3.5" />
            World Verified
          </Button>
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
            const saved = savedIds.has(listing.id);
            const likeCount = listing.likes + (liked ? 1 : 0);
            const allComments = commentsByListing[listing.id] ?? [];
            const sortedComments = [...allComments]
              .map((c) => ({ ...c, effectiveLikes: c.likes + (commentLikedIds.has(c.id) ? 1 : 0) }))
              .sort((a, b) => b.effectiveLikes - a.effectiveLikes);
            const topComments = sortedComments.slice(0, 3);
            const remainingComments = sortedComments.slice(3);
            const commentDraft = commentDrafts[listing.id] ?? '';

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
                        <AvatarImage src={listing.seller.avatar} alt={listing.seller.name} />
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

                <div className="w-full overflow-hidden bg-muted">
                  <PhotoCarousel photos={listing.photos} alt={listing.model} />
                </div>

                <CardContent className="px-4 pt-3 pb-3">
                  <div className="mb-3 flex flex-col gap-1">
                    <span className="text-base font-bold text-foreground">{formatPrice(listing.price)}</span>
                    <CardTitle className="text-base font-semibold leading-snug">{listing.model}</CardTitle>
                  </div>

                  <Collapsible
                    open={expandedDescIds.has(listing.id)}
                    onOpenChange={(open) => {
                      setExpandedDescIds((prev) => {
                        const next = new Set(prev);
                        open ? next.add(listing.id) : next.delete(listing.id);
                        return next;
                      });
                    }}
                  >
                    <CardDescription className={cn(
                      'text-sm leading-relaxed text-foreground/75',
                      !expandedDescIds.has(listing.id) && 'line-clamp-2',
                    )}>
                      {listing.description}
                    </CardDescription>

                    <CollapsibleTrigger
                      className="mt-1 cursor-pointer bg-transparent px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {expandedDescIds.has(listing.id) ? 'See less' : 'See more'}
                    </CollapsibleTrigger>
                  </Collapsible>

                </CardContent>

                {/* ── Inline comments ── */}
                <div className="border-t px-4 pt-3 pb-2">
                  {topComments.length > 0 ? (
                    <Collapsible
                      open={expandedCommentsIds.has(listing.id)}
                      onOpenChange={(open) => {
                        setExpandedCommentsIds((prev) => {
                          const next = new Set(prev);
                          open ? next.add(listing.id) : next.delete(listing.id);
                          return next;
                        });
                      }}
                    >
                      <div className="mb-3 flex flex-col gap-2.5">
                        {topComments.map((comment) => {
                          const cLiked = commentLikedIds.has(comment.id);
                          return (
                            <div key={comment.id} className="flex items-start gap-2">
                              <Avatar className="mt-0.5 size-6 shrink-0 bg-foreground text-background after:border-foreground/10">
                                <AvatarImage src={comment.avatar} alt={comment.author} />
                                <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                                  {commentInitials(comment.author).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs">
                                  <span className="font-semibold text-foreground">{comment.author}</span>
                                  {' '}
                                  <span className="text-foreground/75">{comment.body}</span>
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">{comment.timeLabel}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleCommentLike(comment.id)}
                                    className={cn(
                                      'flex items-center gap-0.5 text-[10px] font-medium transition-colors',
                                      cLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                                    )}
                                    aria-label={cLiked ? 'Unlike comment' : 'Like comment'}
                                  >
                                    <Heart className={cn('size-3', cLiked && 'fill-current')} />
                                    {comment.effectiveLikes}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {remainingComments.length > 0 && (
                          <>
                            <CollapsibleContent>
                              <div className="flex flex-col gap-2.5">
                                {remainingComments.map((comment) => {
                                  const cLiked = commentLikedIds.has(comment.id);
                                  return (
                                    <div key={comment.id} className="flex items-start gap-2">
                                      <Avatar className="mt-0.5 size-6 shrink-0 bg-foreground text-background after:border-foreground/10">
                                        <AvatarImage src={comment.avatar} alt={comment.author} />
                                        <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                                          {commentInitials(comment.author).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs">
                                          <span className="font-semibold text-foreground">{comment.author}</span>
                                          {' '}
                                          <span className="text-foreground/75">{comment.body}</span>
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground">{comment.timeLabel}</span>
                                          <button
                                            type="button"
                                            onClick={() => toggleCommentLike(comment.id)}
                                            className={cn(
                                              'flex items-center gap-0.5 text-[10px] font-medium transition-colors',
                                              cLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                                            )}
                                            aria-label={cLiked ? 'Unlike comment' : 'Like comment'}
                                          >
                                            <Heart className={cn('size-3', cLiked && 'fill-current')} />
                                            {comment.effectiveLikes}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>

                            <CollapsibleTrigger
                              className="cursor-pointer bg-transparent text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {expandedCommentsIds.has(listing.id) ? 'Show less' : `View all ${allComments.length} comments`}
                            </CollapsibleTrigger>
                          </>
                        )}
                      </div>
                    </Collapsible>
                  ) : null}

                  {/* Comment input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={commentDraft}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(listing.id); } }}
                      placeholder="Add a comment…"
                      className="h-8 flex-1 rounded-full bg-muted/40 px-3.5 text-xs"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={!commentDraft.trim()}
                      onClick={() => addComment(listing.id)}
                      aria-label="Post comment"
                      className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <Send className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <CardFooter className="items-stretch bg-card p-0">
                  <Button
                    variant="ghost"
                    onClick={(event) => toggleLike(listing.id, event)}
                    aria-label={`${liked ? 'Unlike' : 'Like'} listing, ${likeCount} likes`}
                    className={cn(
                      'h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      liked && 'text-primary',
                    )}
                  >
                    <Heart className={cn('size-[18px]', liked && 'fill-current')} />
                    <span>{likeCount}</span>
                  </Button>

                  <Separator orientation="vertical" className="my-3 h-auto" />

                  <Button variant="ghost" asChild className="h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground">
                    <Link
                      href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
                      aria-label="Reply to seller"
                    >
                      <Reply className="size-[18px] -scale-x-100" />
                    </Link>
                  </Button>

                  <Separator orientation="vertical" className="my-3 h-auto" />

                  <Button
                    variant="ghost"
                    onClick={(event) => handleSaveListing(listing.id, event)}
                    aria-label={saved ? 'Unsave listing' : 'Save listing'}
                    className={cn(
                      'h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                      saved && 'text-primary',
                    )}
                  >
                    <Bookmark className={cn('size-[18px]', saved && 'fill-current')} />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
