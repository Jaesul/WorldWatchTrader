'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  LayoutGrid,
  List,
  MessageCircle,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LISTINGS, formatPrice, type Badge as ListingBadge, type Listing } from '@/lib/design/data';
import { toggleSave as toggleSaveListing } from '@/lib/design/interaction-store';
import { useSavedIds } from '@/lib/design/use-saved-ids';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest';
type ViewMode = 'feed' | 'grid';

type FakeComment = {
  id: string;
  author: string;
  avatar: string;
  body: string;
  timeLabel: string;
  likes: number;
};

type RichComment = FakeComment & { effectiveLikes: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_CHOICES: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

function sortTriggerLabel(sort: SortOption | null): string {
  if (!sort) return 'Sort by';
  return SORT_CHOICES.find((c) => c.value === sort)?.label ?? 'Sort by';
}

const VIEW_MODE_STORAGE_KEY = 'wwt-design-feed-view-mode';

function readStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'feed';
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return raw === 'grid' || raw === 'feed' ? raw : 'feed';
  } catch {
    return 'feed';
  }
}

function persistViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

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
  { title: 'Rolex Submariner Date', subtitle: 'Black dial, Oyster bracelet', query: 'Rolex Submariner Date' },
  { title: 'Rolex GMT-Master II Pepsi', subtitle: 'Blue and red bezel, Jubilee bracelet', query: 'Rolex GMT-Master II Pepsi' },
  { title: 'Rolex Daytona Panda', subtitle: 'White dial chronograph', query: 'Rolex Daytona Panda' },
  { title: 'Rolex Datejust 41 Wimbledon', subtitle: 'Slate Roman dial, fluted bezel', query: 'Rolex Datejust 41 Wimbledon' },
  { title: 'Rolex Explorer 40', subtitle: 'Black dial, brushed Oyster bracelet', query: 'Rolex Explorer 40' },
  { title: 'Rolex Day-Date 40 President', subtitle: 'Champagne dial, yellow gold', query: 'Rolex Day-Date 40 President' },
];

const BADGE_META: Record<
  ListingBadge,
  { label: string; icon?: LucideIcon; variant: 'brand' | 'outline'; className?: string }
> = {
  'world-verified': { label: 'World Verified', variant: 'brand' },
  'power-seller': {
    label: 'Power Seller',
    icon: Star,
    variant: 'outline',
    className: 'border-primary/40 bg-primary/10 text-primary',
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function OrbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M9.96783 18.9357C14.9206 18.9357 18.9357 14.9206 18.9357 9.96783C18.9357 5.01503 14.9206 1 9.96783 1C5.01503 1 1 5.01503 1 9.96783C1 14.9206 5.01503 18.9357 9.96783 18.9357Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" />
      <path d="M10.0406 10.5109C11.5667 10.5109 12.8038 9.27372 12.8038 7.74762C12.8038 6.22152 11.5667 4.98438 10.0406 4.98438C8.51449 4.98438 7.27734 6.22152 7.27734 7.74762C7.27734 9.27372 8.51449 10.5109 10.0406 10.5109Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" />
      <path d="M7.07422 13.9844H12.9767" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" />
    </svg>
  );
}

function BadgeChip({ badge }: { badge: ListingBadge }) {
  if (badge === 'world-verified') {
    return (
      <Badge variant="brand" className="size-6 rounded-full p-0 text-white" aria-label="World Verified">
        <Image src="/orb.svg" alt="" width={12} height={12} className="size-4 brightness-0 invert" aria-hidden />
      </Badge>
    );
  }
  const { className, icon: Icon, label, variant } = BADGE_META[badge];
  return (
    <Badge variant={variant} className={cn('h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold', className)}>
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
          if (entry.isIntersecting) setActiveIdx(Number((entry.target as HTMLElement).dataset.idx));
        }
      },
      { root: container, threshold: 0.6 },
    );
    container.querySelectorAll('[data-idx]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [photos.length]);

  function scrollTo(idx: number) {
    containerRef.current?.scrollTo({ left: idx * (containerRef.current.offsetWidth), behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="flex snap-x snap-mandatory overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {photos.map((src, i) => (
          <div key={i} data-idx={i} className="aspect-[4/3] w-full shrink-0 snap-start">
            <Image src={src} alt={`${alt} — ${i + 1} of ${photos.length}`} width={1200} height={900} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          {activeIdx > 0 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); scrollTo(activeIdx - 1); }} className="absolute left-2 top-1/2 z-[1] flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 active:scale-95" aria-label="Previous photo">
              <ChevronLeft className="size-5" />
            </button>
          )}
          {activeIdx < photos.length - 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); scrollTo(activeIdx + 1); }} className="absolute right-2 top-1/2 z-[1] flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 active:scale-95" aria-label="Next photo">
              <ChevronRight className="size-5" />
            </button>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{activeIdx + 1}/{photos.length}</span>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-2">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
                className={cn(
                  'flex size-3 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90',
                  i === activeIdx ? 'bg-white shadow-sm' : 'bg-white/45 hover:bg-white/70',
                )}
                aria-label={`Photo ${i + 1}`}
              >
                <span className={cn('size-2 rounded-full', i === activeIdx ? 'bg-black/40' : 'bg-white')} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function commentInitials(name: string) {
  const parts = name.split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function buildFakeComments(listing: Listing): FakeComment[] {
  return [
    { author: 'Marco K.', avatar: 'https://i.pravatar.cc/150?u=marco-k', body: `Is the ${listing.model} still available, and are there any scratches on the clasp?`, timeLabel: '14m ago', likes: 7 },
    { author: 'Nina P.', avatar: 'https://i.pravatar.cc/150?u=nina-p', body: `Love this one. ${listing.boxPapers} and ${listing.condition.toLowerCase()} makes it really compelling.`, timeLabel: '39m ago', likes: 12 },
    { author: 'Samir T.', avatar: 'https://i.pravatar.cc/150?u=samir-t', body: `Would you consider a trade plus cash, or are you only looking for a straight sale?`, timeLabel: '1h ago', likes: 4 },
    { author: 'Jess A.', avatar: 'https://i.pravatar.cc/150?u=jess-a', body: `Can you share a movement shot and maybe a quick lume photo in messages?`, timeLabel: '3h ago', likes: 9 },
    { author: 'Theo R.', avatar: 'https://i.pravatar.cc/150?u=theo-r', body: `Price feels fair for a ${listing.condition.toLowerCase()} example. Curious how much traction you've had so far.`, timeLabel: '5h ago', likes: 3 },
  ].map((c, i) => ({ id: `${listing.id}-comment-${i + 1}`, ...c }));
}

function createInitialComments() {
  return Object.fromEntries(LISTINGS.map((l) => [l.id, buildFakeComments(l)])) as Record<string, FakeComment[]>;
}

// ── Listing Detail Drawer ─────────────────────────────────────────────────────

type DrawerProps = {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  saved: boolean;
  onToggleSave: () => void;
  comments: RichComment[];
  commentLikedIds: Set<string>;
  onToggleCommentLike: (id: string) => void;
  commentDraft: string;
  onCommentDraftChange: (val: string) => void;
  onAddComment: () => void;
};

function ListingDetailDrawer({
  listing,
  open,
  onOpenChange,
  liked,
  likeCount,
  onToggleLike,
  saved,
  onToggleSave,
  comments,
  commentLikedIds,
  onToggleCommentLike,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
}: DrawerProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (open) setDescExpanded(false);
  }, [listing.id, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl border-x px-0 pb-0"
      >
        <SheetTitle className="sr-only">{listing.model}</SheetTitle>
        <SheetDescription className="sr-only">Full listing details for {listing.model}</SheetDescription>

        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo carousel */}
          <div className="overflow-hidden bg-muted">
            <PhotoCarousel photos={listing.photos} alt={listing.model} />
          </div>

          <div className="px-4 pt-4 pb-2">
            {/* Price + time */}
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-xl font-bold text-foreground">{formatPrice(listing.price)}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />
                {listing.postedAt}
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-base font-semibold leading-snug text-foreground">{listing.model}</h2>

            {/* Description */}
            <Collapsible open={descExpanded} onOpenChange={setDescExpanded}>
              <p className={cn('text-sm leading-relaxed text-foreground/75', !descExpanded && 'line-clamp-3')}>
                {listing.description}
              </p>
              <CollapsibleTrigger className="mt-1 cursor-pointer bg-transparent px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {descExpanded ? 'See less' : 'See more'}
              </CollapsibleTrigger>
            </Collapsible>

            {/* Seller row */}
            <Link
              href={`/design/u/${listing.seller.handle}`}
              className="mt-4 mb-4 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <Avatar className="size-9 bg-foreground text-background after:border-foreground/10">
                <AvatarImage src={listing.seller.avatar} alt={listing.seller.name} />
                <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                  <SellerInitials name={listing.seller.name} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{listing.seller.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {listing.seller.badges.slice(0, 2).map((b) => (
                    <BadgeChip key={b} badge={b} />
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4 shrink-0 text-muted-foreground/50">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {/* Action chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <Button asChild size="sm" className="shrink-0 rounded-full">
                <Link href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}>
                  <Reply className="size-3.5 -scale-x-100" />
                  Reply to seller
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn('shrink-0 rounded-full', liked && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20')}
                onClick={onToggleLike}
              >
                <Heart className={cn('size-3.5', liked && 'fill-current')} />
                {likeCount}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn('shrink-0 rounded-full', saved && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20')}
                onClick={onToggleSave}
              >
                <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full text-muted-foreground">
                <MessageCircle className="size-3.5" />
                {comments.length}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Comments */}
          <div className="px-4 pt-3 pb-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comments
            </p>
            {comments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => {
                  const cLiked = commentLikedIds.has(comment.id);
                  return (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="mt-0.5 size-8 shrink-0 bg-foreground text-background after:border-foreground/10">
                        <AvatarImage src={comment.avatar} alt={comment.author} />
                        <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                          {commentInitials(comment.author).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{comment.author}</span>
                          {' '}
                          <span className="text-foreground/80">{comment.body}</span>
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground">{comment.timeLabel}</span>
                          <button
                            type="button"
                            onClick={() => onToggleCommentLike(comment.id)}
                            className={cn(
                              'flex items-center gap-1 text-[11px] font-medium transition-colors',
                              cLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                            )}
                            aria-label={cLiked ? 'Unlike comment' : 'Like comment'}
                          >
                            <Heart className={cn('size-3.5', cLiked && 'fill-current')} />
                            {comment.effectiveLikes}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky comment input */}
        <div
          className="shrink-0 border-t px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <Input
              value={commentDraft}
              onChange={(e) => onCommentDraftChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAddComment(); } }}
              placeholder="Add a comment…"
              className="h-9 flex-1 rounded-full bg-muted/40 px-4 text-sm"
              autoFocus={false}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!commentDraft.trim()}
              onClick={onAddComment}
              aria-label="Post comment"
              className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Feed Page ─────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  const [sellerBadgeFilter, setSellerBadgeFilter] = useState<ListingBadge | null>(null);
  const [worldVerified, setWorldVerified] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [drawerListing, setDrawerListing] = useState<Listing | null>(null);

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const savedIds = useSavedIds();
  const [commentsByListing, setCommentsByListing] = useState<Record<string, FakeComment[]>>(createInitialComments);
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addComment(listingId: string) {
    const body = (commentDrafts[listingId] ?? '').trim();
    if (!body) return;
    setCommentsByListing((prev) => {
      const next: FakeComment = { id: `${listingId}-comment-${Date.now()}`, author: 'You', avatar: 'https://i.pravatar.cc/150?u=me-user', body, timeLabel: 'Just now', likes: 0 };
      return { ...prev, [listingId]: [...(prev[listingId] ?? []), next] };
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

  // Drawer helpers
  const drawerComments: RichComment[] = drawerListing
    ? (commentsByListing[drawerListing.id] ?? [])
        .map((c) => ({ ...c, effectiveLikes: c.likes + (commentLikedIds.has(c.id) ? 1 : 0) }))
        .sort((a, b) => b.effectiveLikes - a.effectiveLikes)
    : [];

  return (
    <div className="bg-muted/30">
      {/* ── Action bar ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        {/* Search row */}
        <div
          className="relative mb-3"
          onBlur={() => { window.setTimeout(() => setSearchOpen(false), 100); }}
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
                <CardDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">Suggested searches</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-1.5">
                <div className="flex flex-col">
                  {suggestedSearches.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { setSearch(item.query); setSearchOpen(false); }}
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

        {/* Filter + view toggle row */}
        <div className="flex items-center gap-2 pb-0.5">
          {/* Scrollable filters */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {/* Clear */}
            <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters} className="shrink-0 rounded-full" aria-label="Clear all filters">
              <X className="size-3.5" />
            </Button>

            {/* Funnel */}
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

            {/* Expanding filter controls */}
            <div className={cn('flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out', filterOpen ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 pointer-events-none')}>
              <Sheet open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-fit max-w-full shrink-0 cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                    aria-haspopup="dialog"
                    aria-expanded={sortSheetOpen}
                  >
                    <span className="truncate">{sortTriggerLabel(sortBy)}</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[min(85dvh,560px)] rounded-t-2xl px-4 pb-6 pt-2">
                  <SheetHeader className="text-left">
                    <SheetTitle>Sort listings</SheetTitle>
                    <SheetDescription>Choose how results are ordered in the feed.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 flex flex-col gap-2">
                    {SORT_CHOICES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setSortBy(value); setSortSheetOpen(false); }}
                        className={cn('rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors', sortBy === value ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background hover:bg-muted/50')}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setSortBy(null); setSortSheetOpen(false); }}
                      disabled={sortBy === null}
                      className="rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Default (no sort)
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

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

            {/* World Verified */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorldVerified((v) => !v)}
              className={cn('shrink-0 rounded-full', worldVerified && 'border-world-verified bg-world-verified text-world-verified-foreground hover:bg-world-verified/90 hover:text-world-verified-foreground')}
            >
              <OrbIcon className="size-3.5" />
              World Verified
            </Button>
          </div>

          {/* View toggle — pinned right, not scrollable */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => {
              setViewMode((v) => {
                const next = v === 'feed' ? 'grid' : 'feed';
                persistViewMode(next);
                return next;
              });
            }}
            aria-label={viewMode === 'feed' ? 'Switch to grid view' : 'Switch to feed view'}
            className="shrink-0 rounded-full"
          >
            {viewMode === 'feed' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="p-3">
          <Card className="py-0">
            <CardContent className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No listings found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'feed' ? (
        // ── Feed view ──────────────────────────────────────────────────────────
        <div className="flex flex-col gap-3 p-3">
          {filtered.map((listing) => {
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
                    <Link href={`/design/u/${listing.seller.handle}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Avatar className="bg-foreground text-background after:border-foreground/10">
                        <AvatarImage src={listing.seller.avatar} alt={listing.seller.name} />
                        <AvatarFallback className="bg-foreground text-sm font-bold text-background">
                          <SellerInitials name={listing.seller.name} />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/design/u/${listing.seller.handle}`} className="text-sm font-semibold text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
                          {listing.seller.name}
                        </Link>
                        {listing.seller.badges.slice(0, 2).map((badge) => <BadgeChip key={badge} badge={badge} />)}
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
                    <CardDescription className={cn('text-sm leading-relaxed text-foreground/75', !expandedDescIds.has(listing.id) && 'line-clamp-2')}>
                      {listing.description}
                    </CardDescription>
                    <CollapsibleTrigger className="mt-1 cursor-pointer bg-transparent px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {expandedDescIds.has(listing.id) ? 'See less' : 'See more'}
                    </CollapsibleTrigger>
                  </Collapsible>
                </CardContent>

                {/* Inline comments */}
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
                                  <span className="font-semibold text-foreground">{comment.author}</span>{' '}
                                  <span className="text-foreground/75">{comment.body}</span>
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">{comment.timeLabel}</span>
                                  <button type="button" onClick={() => toggleCommentLike(comment.id)} className={cn('flex items-center gap-0.5 text-[10px] font-medium transition-colors', cLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground')} aria-label={cLiked ? 'Unlike comment' : 'Like comment'}>
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
                                          <span className="font-semibold text-foreground">{comment.author}</span>{' '}
                                          <span className="text-foreground/75">{comment.body}</span>
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground">{comment.timeLabel}</span>
                                          <button type="button" onClick={() => toggleCommentLike(comment.id)} className={cn('flex items-center gap-0.5 text-[10px] font-medium transition-colors', cLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground')} aria-label={cLiked ? 'Unlike comment' : 'Like comment'}>
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
                            <CollapsibleTrigger className="cursor-pointer bg-transparent text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                              {expandedCommentsIds.has(listing.id) ? 'Show less' : `View all ${allComments.length} comments`}
                            </CollapsibleTrigger>
                          </>
                        )}
                      </div>
                    </Collapsible>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Input
                      value={commentDraft}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(listing.id); } }}
                      placeholder="Add a comment…"
                      className="h-8 flex-1 rounded-full bg-muted/40 px-3.5 text-xs"
                    />
                    <Button size="icon-sm" variant="ghost" disabled={!commentDraft.trim()} onClick={() => addComment(listing.id)} aria-label="Post comment" className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <Send className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <CardFooter className="items-stretch bg-card p-0">
                  <Button
                    variant="ghost"
                    onClick={(event) => toggleLike(listing.id, event)}
                    aria-label={`${liked ? 'Unlike' : 'Like'} listing, ${likeCount} likes`}
                    className={cn('h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground', liked && 'text-primary')}
                  >
                    <Heart className={cn('size-[18px]', liked && 'fill-current')} />
                    <span>{likeCount}</span>
                  </Button>
                  <Separator orientation="vertical" className="my-3 h-auto" />
                  <Button variant="ghost" asChild className="h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground">
                    <Link href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`} aria-label="Reply to seller">
                      <Reply className="size-[18px] -scale-x-100" />
                    </Link>
                  </Button>
                  <Separator orientation="vertical" className="my-3 h-auto" />
                  <Button
                    variant="ghost"
                    onClick={(event) => handleSaveListing(listing.id, event)}
                    aria-label={saved ? 'Unsave listing' : 'Save listing'}
                    className={cn('h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground', saved && 'text-primary')}
                  >
                    <Bookmark className={cn('size-[18px]', saved && 'fill-current')} />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        // ── Grid view ──────────────────────────────────────────────────────────
        <div className="grid grid-cols-2 gap-2 p-2">
          {filtered.map((listing) => {
            const liked = likedIds.has(listing.id);
            const saved = savedIds.has(listing.id);
            const likeCount = listing.likes + (liked ? 1 : 0);

            return (
              <div
                key={listing.id}
                role="button"
                tabIndex={0}
                onClick={() => setDrawerListing(listing)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrawerListing(listing); }}
                className="flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-colors hover:bg-card/80 active:scale-[0.98]"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <Image
                    src={listing.photos[0]}
                    alt={listing.model}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 300px"
                  />
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                  {/* Seller */}
                  <div className="flex min-w-0 items-center gap-1.5">
                    <img
                      src={listing.seller.avatar}
                      alt=""
                      className="size-4 shrink-0 rounded-full object-cover"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate text-[11px] font-medium text-foreground/75">
                      {listing.seller.name}
                    </span>
                    {listing.seller.badges.includes('world-verified') && (
                      <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-world-verified" aria-label="World Verified">
                        <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-2">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                      </span>
                    )}
                    {listing.seller.badges.includes('power-seller') && (
                      <Star className="size-3 shrink-0 fill-primary text-primary" aria-label="Power Seller" />
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-sm font-bold leading-none text-foreground">{formatPrice(listing.price)}</p>

                  {/* Title */}
                  <p className="line-clamp-1 text-xs font-semibold leading-snug text-foreground">
                    {listing.model}
                  </p>

                  {/* Description — flex-1 pushes actions to the bottom */}
                  <p className="line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                    {listing.description}
                  </p>

                  {/* Actions */}
                  <div className="mt-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleLike(listing.id, e); }}
                      className={cn('flex min-h-8 items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors', liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
                      aria-label={liked ? 'Unlike' : 'Like'}
                    >
                      <Heart className={cn('size-3.5', liked && 'fill-current')} />
                      {likeCount}
                    </button>

                    <Link
                      href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex min-h-8 min-w-8 items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Reply to seller"
                    >
                      <Reply className="size-3.5 -scale-x-100" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSaveListing(listing.id); }}
                      className={cn('ml-auto flex min-h-8 min-w-8 items-center justify-center rounded-full p-1.5 transition-colors', saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
                      aria-label={saved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Listing detail drawer (grid mode) ── */}
      {drawerListing && (
        <ListingDetailDrawer
          listing={drawerListing}
          open={drawerListing !== null}
          onOpenChange={(open) => { if (!open) setDrawerListing(null); }}
          liked={likedIds.has(drawerListing.id)}
          likeCount={drawerListing.likes + (likedIds.has(drawerListing.id) ? 1 : 0)}
          onToggleLike={() => setLikedIds((prev) => {
            const next = new Set(prev);
            if (next.has(drawerListing.id)) next.delete(drawerListing.id); else next.add(drawerListing.id);
            return next;
          })}
          saved={savedIds.has(drawerListing.id)}
          onToggleSave={() => toggleSaveListing(drawerListing.id)}
          comments={drawerComments}
          commentLikedIds={commentLikedIds}
          onToggleCommentLike={toggleCommentLike}
          commentDraft={commentDrafts[drawerListing.id] ?? ''}
          onCommentDraftChange={(val) => setCommentDrafts((prev) => ({ ...prev, [drawerListing.id]: val }))}
          onAddComment={() => addComment(drawerListing.id)}
        />
      )}
    </div>
  );
}
