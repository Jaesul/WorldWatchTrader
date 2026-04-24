"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  LayoutGrid,
  List,
  Reply,
  MoreHorizontal,
  Search,
  Send,
  Star,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DesignListingCommentRow } from "@/components/design/DesignListingCommentRow";
import { ListingDetailDrawer } from "@/components/design/ListingDetailDrawer";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import {
  formatPrice,
  listingMatchesFeedSearch,
  type Badge as ListingBadge,
} from "@/lib/design/data";
import type { DesignFeedListing } from "@/lib/design/map-db-feed-to-listing";
import {
  isViewerAuthoredComment,
  type FakeComment,
  type RichComment,
} from "@/lib/design/listing-drawer-comments";
import { useDesignEngagement } from "@/lib/design/use-design-engagement";
import { useDesignListingSaves } from "@/lib/design/use-design-listing-saves";
import { designDmReplyHref } from "@/lib/design/dm-reply";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useDrawerResident } from "@/hooks/use-drawer-resident";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortOption = "price-asc" | "price-desc" | "newest" | "oldest";
type ViewMode = "feed" | "grid";

/**
 * After sorting by recency, pick the next row so the same seller never appears twice in a row
 * when any other seller is still available (may relax strict time order slightly).
 */
function staggerNoAdjacentSameSeller<T extends { _sellerId: string }>(
  sortedNewestFirst: T[],
): T[] {
  const remaining: T[] = [...sortedNewestFirst];
  const out: T[] = [];
  let lastSellerId: string | null = null;
  while (remaining.length > 0) {
    let pickIdx = 0;
    if (lastSellerId !== null) {
      const alt = remaining.findIndex((l) => l._sellerId !== lastSellerId);
      pickIdx = alt >= 0 ? alt : 0;
    }
    const next = remaining.splice(pickIdx, 1)[0]!;
    out.push(next);
    lastSellerId = next._sellerId;
  }
  return out;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_CHOICES: { value: SortOption; label: string }[] = [
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

function sortTriggerLabel(sort: SortOption | null): string {
  const effective = sort ?? "newest";
  return SORT_CHOICES.find((c) => c.value === effective)?.label ?? "Sort by";
}

/** Slider domain for the feed price filter (USD, design sandbox). */
const FEED_PRICE_MIN = 0;
const FEED_PRICE_MAX = 150_000;

const VIEW_MODE_STORAGE_KEY = "wwt-design-feed-view-mode";

/** Progressive list: initial chunk and each infinite-scroll step. */
const PAGE_SIZE = 5;

/** Max listing hits shown in the search drawer. */
const SEARCH_DRAWER_MATCH_LIMIT = 20;

const SCROLL_ROOT_SELECTOR = "[data-design-scroll-root]";

function FeedListingSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="space-y-2 px-4 py-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%] max-w-[280px]" />
      </CardContent>
      <div className="border-t px-4 py-2">
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
      <div className="flex border-t">
        <Skeleton className="h-11 flex-1 rounded-none" />
        <Skeleton className="h-11 flex-1 rounded-none" />
        <Skeleton className="h-11 flex-1 rounded-none" />
      </div>
    </Card>
  );
}

function GridListingSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[90%]" />
      </div>
    </div>
  );
}

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "feed";
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return raw === "grid" || raw === "feed" ? raw : "feed";
  } catch {
    return "feed";
  }
}

function persistViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

const SELLER_BADGE_LABEL: Partial<Record<ListingBadge, string>> = {
  "power-seller": "Power Seller",
};

const SEARCH_RECOMMENDATIONS = [
  {
    title: "Rolex Submariner Date",
    subtitle: "Black dial, Oyster bracelet",
    query: "Rolex Submariner Date",
  },
  {
    title: "Rolex GMT-Master II Pepsi",
    subtitle: "Blue and red bezel, Jubilee bracelet",
    query: "Rolex GMT-Master II Pepsi",
  },
  {
    title: "Rolex Daytona Panda",
    subtitle: "White dial chronograph",
    query: "Rolex Daytona Panda",
  },
  {
    title: "Rolex Datejust 41 Wimbledon",
    subtitle: "Slate Roman dial, fluted bezel",
    query: "Rolex Datejust 41 Wimbledon",
  },
  {
    title: "Rolex Explorer 40",
    subtitle: "Black dial, brushed Oyster bracelet",
    query: "Rolex Explorer 40",
  },
  {
    title: "Rolex Day-Date 40 President",
    subtitle: "Champagne dial, yellow gold",
    query: "Rolex Day-Date 40 President",
  },
];

const BADGE_META: Record<
  ListingBadge,
  {
    label: string;
    icon?: LucideIcon;
    variant: "brand" | "outline";
    className?: string;
  }
> = {
  "world-verified": { label: "World Verified", variant: "brand" },
  "power-seller": {
    label: "Power Seller",
    icon: Star,
    variant: "outline",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BadgeChip({ badge }: { badge: ListingBadge }) {
  if (badge === "world-verified") {
    return (
      <Badge
        variant="brand"
        className="size-6 rounded-full p-0 text-white"
        aria-label="World Verified"
      >
        <WorldOrbIcon className="size-3.5" />
      </Badge>
    );
  }
  const { className, icon: Icon, label, variant } = BADGE_META[badge];
  return (
    <Badge
      variant={variant}
      className={cn(
        "h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold",
        className,
      )}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {label}
    </Badge>
  );
}

function SellerInitials({ name }: { name: string }) {
  const parts = name.split(" ");
  return <>{(parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()}</>;
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
          if (entry.isIntersecting)
            setActiveIdx(Number((entry.target as HTMLElement).dataset.idx));
        }
      },
      { root: container, threshold: 0.6 },
    );
    container
      .querySelectorAll("[data-idx]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [photos.length]);

  function scrollTo(idx: number) {
    containerRef.current?.scrollTo({
      left: idx * containerRef.current.offsetWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            data-idx={i}
            className="aspect-[4/3] w-full shrink-0 snap-start"
          >
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
              onClick={(e) => {
                e.stopPropagation();
                scrollTo(activeIdx - 1);
              }}
              className="absolute left-2 top-1/2 z-[1] flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {activeIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollTo(activeIdx + 1);
              }}
              className="absolute right-2 top-1/2 z-[1] flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {activeIdx + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
}

// ── Feed Page ─────────────────────────────────────────────────────────────────

export function DesignMarketplaceClient({
  initialListings,
}: {
  initialListings: DesignFeedListing[];
}) {
  const { viewer } = useDesignViewer();

  const [search, setSearch] = useState("");
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  const [sellerBadgeFilter, setSellerBadgeFilter] =
    useState<ListingBadge | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    FEED_PRICE_MIN,
    FEED_PRICE_MAX,
  ]);
  const [priceRangeDraft, setPriceRangeDraft] = useState<[number, number]>([
    FEED_PRICE_MIN,
    FEED_PRICE_MAX,
  ]);
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [drawerListing, setDrawerListing] = useState<DesignFeedListing | null>(null);
  /**
   * Keeps the listing mounted during the drawer's close animation so the
   * exit transition can play after `setDrawerListing(null)`.
   */
  const drawerResident = useDrawerResident(drawerListing);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreGuardRef = useRef({
    visibleCount: PAGE_SIZE,
    filteredLen: 0,
    isLoadingMore: false,
  });

  const sellerFilterBadges = useMemo(
    () => [
      ...new Set(
        initialListings.flatMap((l) => l.seller.badges).filter(
          (b): b is ListingBadge => b !== "world-verified",
        ),
      ),
    ],
    [initialListings],
  );

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);
  const {
    likedListingIds,
    likedCommentIds,
    ensureLoaded: ensureEngagementLoaded,
    displayListingLikes,
    displayCommentLikes,
    toggleListingLike,
    toggleCommentLike,
    refreshEngagement,
  } = useDesignEngagement();
  const {
    savedIds,
    ensureSavedIdsLoaded,
    toggleSave: toggleSaveListing,
  } = useDesignListingSaves();
  const [commentsByListing, setCommentsByListing] = useState<
    Record<string, FakeComment[]>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [expandedDescIds, setExpandedDescIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCommentsIds, setExpandedCommentsIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingCommentIds, setLoadingCommentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void ensureEngagementLoaded();
    void ensureSavedIdsLoaded();
  }, [ensureEngagementLoaded, ensureSavedIdsLoaded]);

  const drawerSuggestedSearches = useMemo(
    () =>
      SEARCH_RECOMMENDATIONS.filter((item) => {
        const haystack = `${item.title} ${item.subtitle}`.toLowerCase();
        return (
          searchDraft.trim() === "" ||
          haystack.includes(searchDraft.toLowerCase())
        );
      }).slice(0, 5),
    [searchDraft],
  );

  const drawerListingMatches = useMemo(() => {
    const q = searchDraft.trim();
    if (!q) return [];
    return initialListings
      .filter((l) => listingMatchesFeedSearch(l, searchDraft))
      .slice(0, SEARCH_DRAWER_MATCH_LIMIT);
  }, [initialListings, searchDraft]);

  const priceFiltered =
    priceRange[0] > FEED_PRICE_MIN || priceRange[1] < FEED_PRICE_MAX;

  /** Non-default sort: anything other than implicit/explicit "newest first". */
  const sortIsExplicitCustom =
    sortBy !== null && sortBy !== "newest";

  const hasFilters =
    sortIsExplicitCustom ||
    sellerBadgeFilter !== null ||
    priceFiltered;

  const currentSortLabel = useMemo(() => {
    const effectiveSort = sortBy ?? "newest";
    return effectiveSort === "newest"
      ? "Newest"
      : sortTriggerLabel(effectiveSort);
  }, [sortBy]);

  const currentPriceLabel = useMemo(() => {
    return priceFiltered
      ? `${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`
      : `${formatPrice(FEED_PRICE_MIN)} – ${formatPrice(FEED_PRICE_MAX)}`;
  }, [priceFiltered, priceRange]);

  function clearFilters() {
    setSortBy(null);
    setSellerBadgeFilter(null);
    setPriceRange([FEED_PRICE_MIN, FEED_PRICE_MAX]);
    setPriceRangeDraft([FEED_PRICE_MIN, FEED_PRICE_MAX]);
    setFilterDrawerOpen(false);
  }

  const sortedForFeed = useMemo(() => {
    return initialListings
      .filter((listing) => {
        const matchSearch = listingMatchesFeedSearch(listing, search);
        const matchBadge =
          !sellerBadgeFilter || listing.seller.badges.includes(sellerBadgeFilter);
        const matchPrice =
          listing.price >= priceRange[0] && listing.price <= priceRange[1];
        return matchSearch && matchBadge && matchPrice;
      })
      .sort((a: DesignFeedListing, b: DesignFeedListing) => {
        const s = sortBy ?? "newest";
        if (s === "price-asc") return a.price - b.price;
        if (s === "price-desc") return b.price - a.price;
        if (s === "newest")
          return b._publishedAt - a._publishedAt || a.id.localeCompare(b.id);
        if (s === "oldest")
          return a._publishedAt - b._publishedAt || a.id.localeCompare(b.id);
        return b._publishedAt - a._publishedAt || a.id.localeCompare(b.id);
      });
  }, [
    initialListings,
    search,
    sellerBadgeFilter,
    priceRange,
    sortBy,
  ]);

  const filtered = useMemo(() => {
    return (sortBy ?? "newest") === "newest"
      ? staggerNoAdjacentSameSeller(sortedForFeed)
      : sortedForFeed;
  }, [sortBy, sortedForFeed]);

  const visibleListings = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  const skeletonSlotCount = isLoadingMore
    ? Math.min(PAGE_SIZE, Math.max(0, filtered.length - visibleCount))
    : 0;

  loadMoreGuardRef.current = {
    visibleCount,
    filteredLen: filtered.length,
    isLoadingMore,
  };

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, filtered.length));
    setIsLoadingMore(false);
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
      loadMoreTimeoutRef.current = null;
    }
  }, [search, sortBy, sellerBadgeFilter, priceRange]);

  useEffect(() => {
    const root = document.querySelector(
      SCROLL_ROOT_SELECTOR,
    ) as Element | null;
    const target = loadMoreSentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const g = loadMoreGuardRef.current;
        if (g.isLoadingMore || g.visibleCount >= g.filteredLen) return;

        if (loadMoreTimeoutRef.current) {
          clearTimeout(loadMoreTimeoutRef.current);
        }
        setIsLoadingMore(true);
        loadMoreTimeoutRef.current = setTimeout(() => {
          loadMoreTimeoutRef.current = null;
          const cap = loadMoreGuardRef.current.filteredLen;
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, cap));
          setIsLoadingMore(false);
        }, 320);
      },
      { root, rootMargin: "220px 0px 0px 0px", threshold: 0 },
    );

    obs.observe(target);
    return () => {
      obs.disconnect();
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
        loadMoreTimeoutRef.current = null;
      }
    };
  }, [viewMode, filtered.length, hasMore]);

  function toggleLike(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    void toggleListingLike(id);
  }

  const ensureCommentsLoaded = useCallback(
    async (listingId: string) => {
      if (commentsByListing[listingId] !== undefined || loadingCommentIds.has(listingId)) return;
      setLoadingCommentIds((prev) => new Set(prev).add(listingId));
      try {
        const res = await fetch(`/api/design/listings/${listingId}/comments`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as { comments?: FakeComment[] };
        setCommentsByListing((prev) => ({
          ...prev,
          [listingId]: data.comments ?? [],
        }));
      } catch {
        toast.error("Could not load comments");
      } finally {
        setLoadingCommentIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [commentsByListing, loadingCommentIds],
  );

  useEffect(() => {
    if (!drawerListing) return;
    void ensureCommentsLoaded(drawerListing.id);
  }, [drawerListing, ensureCommentsLoaded]);

  async function addComment(listingId: string) {
    const body = (commentDrafts[listingId] ?? "").trim();
    if (!body) return;
    const res = await fetch(`/api/design/listings/${listingId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(typeof err?.error === "string" ? err.error : "Could not post comment");
      return;
    }
    const data = (await res.json()) as { comment?: FakeComment };
    if (!data.comment) {
      toast.error("Invalid response");
      return;
    }
    setCommentsByListing((prev) => ({
      ...prev,
      [listingId]: [...(prev[listingId] ?? []), data.comment!],
    }));
    setCommentDrafts((prev) => ({ ...prev, [listingId]: "" }));
    toast.success("Comment posted");
  }

  async function deleteComment(listingId: string, commentId: string) {
    const res = await fetch(
      `/api/design/listings/${listingId}/comments/${commentId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(typeof err?.error === "string" ? err.error : "Could not delete comment");
      return;
    }
    setCommentsByListing((prev) => ({
      ...prev,
      [listingId]: (prev[listingId] ?? []).filter((c) => c.id !== commentId),
    }));
    refreshEngagement();
    toast.success("Comment deleted");
  }

  function handleSaveListing(listingId: string, event: React.MouseEvent) {
    event.stopPropagation();
    void toggleSaveListing(listingId);
  }

  const feedToolbar = (
    <div className="flex shrink-0 items-center gap-1 text-foreground [&_button]:font-normal [&_button_svg]:text-current">
      <Button
        variant="ghost"
        size={search.trim() ? "sm" : "icon-sm"}
        type="button"
        onClick={() => setSearchDrawerOpen(true)}
        className={cn(
          "shrink-0 rounded-full",
          !search.trim() && "size-9 p-2.5",
          search.trim() &&
            "min-w-0 max-w-[min(100%,11rem)] shrink gap-1.5 px-3 py-2",
        )}
        aria-label={
          search.trim() ? `Search (${search.trim()})` : "Open search"
        }
      >
        <Search className="size-5 shrink-0" strokeWidth={2.4} />
        {search.trim() ? (
          <span className="truncate text-xs font-normal">
            {search.trim()}
          </span>
        ) : null}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        onClick={() => {
          setViewMode((v) => {
            const next = v === "feed" ? "grid" : "feed";
            persistViewMode(next);
            return next;
          });
        }}
        aria-label={
          viewMode === "feed" ? "Switch to grid view" : "Switch to feed view"
        }
        className="size-9 shrink-0 rounded-full p-2.5"
      >
        {viewMode === "feed" ? (
          <LayoutGrid className="size-5" strokeWidth={2.4} />
        ) : (
          <List className="size-5" strokeWidth={2.4} />
        )}
      </Button>
    </div>
  );

  // Drawer helpers
  const drawerComments: RichComment[] = drawerResident
    ? (commentsByListing[drawerResident.id] ?? [])
        .map((c) => ({
          ...c,
          effectiveLikes: displayCommentLikes(c.id, c.likes),
        }))
        .sort((a, b) => b.effectiveLikes - a.effectiveLikes)
    : [];

  return (
    <div className="bg-muted/30">
      <div className="shrink-0 bg-background px-3 py-0">
        <div className="flex min-w-0 items-center gap-2 pb-2 pt-1.5">
          <div
            className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none" }}
          >
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="shrink-0 rounded-full bg-[#ffc85c] px-3.5 py-2 text-left text-xs font-medium text-white transition-colors hover:bg-[#ffc85c]/90"
              aria-label="Open sort and filters"
              aria-expanded={filterDrawerOpen}
            >
              {currentSortLabel}
            </button>
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="shrink-0 rounded-full bg-[#ffc85c] px-3.5 py-2 text-left text-xs font-medium text-white transition-colors hover:bg-[#ffc85c]/90"
              aria-label="Open price filters"
              aria-expanded={filterDrawerOpen}
            >
              {currentPriceLabel}
            </button>
            {sellerBadgeFilter ? (
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="shrink-0 rounded-full bg-[#ffc85c] px-3.5 py-2 text-left text-xs font-medium text-white transition-colors hover:bg-[#ffc85c]/90"
                aria-label="Open seller filters"
                aria-expanded={filterDrawerOpen}
              >
                {SELLER_BADGE_LABEL[sellerBadgeFilter] ?? sellerBadgeFilter}
              </button>
            ) : null}
          </div>
          {feedToolbar}
        </div>
      </div>

      {/* Vaul Overlay returns before useCallback when modal={false} — breaks Rules of Hooks. */}
      <Drawer
        direction="right"
        open={searchDrawerOpen}
        onOpenChange={(open) => {
          if (open) {
            setSearchDraft(search);
          } else {
            setSearch(searchDraft.trim());
            if (filterDrawerOpen) setFilterDrawerOpen(false);
          }
          setSearchDrawerOpen(open);
        }}
      >
        <DrawerContent className="z-[50] mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100%,22rem)] flex-col gap-0 rounded-none border-l p-0 sm:max-w-md data-[vaul-drawer-direction=right]:mt-0">
          <DrawerHeader className="border-b border-border px-4 pb-3 pt-4 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <DrawerTitle>Search</DrawerTitle>
                <DrawerDescription>
                  Find watches, brands, or sellers.
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="shrink-0 border-b border-border px-4 py-3">
            <div className="flex min-h-10 min-w-0 items-center gap-0 rounded-full border border-border/60 bg-muted/40 px-1 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35">
              <span
                className="pointer-events-none flex size-9 shrink-0 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                <Search className="size-4" strokeWidth={2.25} />
              </span>
              <Input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Rolex, brands, sellers…"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                className="h-10 min-w-0 flex-1 border-0 bg-transparent py-0 pr-3 pl-0 text-base shadow-none md:text-sm focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {drawerSuggestedSearches.length > 0 ? (
              <section className="mb-6" aria-labelledby="search-suggested-heading">
                <h2
                  id="search-suggested-heading"
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Suggested searches
                </h2>
                <div className="flex flex-col gap-1">
                  {drawerSuggestedSearches.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      onClick={() => {
                        setSearch(item.query);
                        setSearchDraft(item.query);
                        setSearchDrawerOpen(false);
                      }}
                      className="flex items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="mt-0.5 rounded-full bg-muted p-1.5 text-muted-foreground">
                        <Search className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {drawerListingMatches.length > 0 ? (
              <section aria-labelledby="search-listings-heading">
                <h2
                  id="search-listings-heading"
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Listings
                </h2>
                <div className="flex flex-col gap-1">
                  {drawerListingMatches.map((listing) => (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() => {
                        setSearch(listing.model);
                        setSearchDraft(listing.model);
                        setSearchDrawerOpen(false);
                      }}
                      className="flex w-full gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {listing.photos[0] ? (
                          <Image
                            src={listing.photos[0]}
                            alt={listing.model}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="line-clamp-2 text-sm font-medium text-foreground">
                          {listing.model}
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatPrice(listing.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : searchDraft.trim() ? (
              <p className="text-sm text-muted-foreground">
                No listings match that search.
              </p>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        direction="right"
        open={filterDrawerOpen}
        onOpenChange={(open) => {
          setFilterDrawerOpen(open);
          if (open) setPriceRangeDraft(priceRange);
        }}
      >
        <DrawerContent
          overlayClassName="z-[55]"
          className="z-[60] mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100%,22rem)] gap-0 rounded-none border-l p-0 sm:max-w-md data-[vaul-drawer-direction=right]:mt-0"
        >
          <DrawerHeader className="border-b border-border px-4 pb-3 pt-4 text-left">
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Sort, price band, and seller badges. Current sort:{" "}
              <span className="font-medium text-foreground">
                {sortTriggerLabel(sortBy)}
              </span>
              {priceFiltered ? (
                <>
                  {" "}
                  · Price{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                  </span>
                </>
              ) : null}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              <section aria-labelledby="filter-sort-heading">
                <h2
                  id="filter-sort-heading"
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Sort
                </h2>
                <div className="flex flex-col gap-2">
                  {SORT_CHOICES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSortBy(value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        sortBy === value ||
                          (sortBy === null && value === "newest")
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSortBy(null)}
                    disabled={sortBy === null}
                    className="rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Newest first (default)
                  </button>
                </div>
              </section>

              <Separator />

              <section aria-labelledby="filter-price-heading">
                <h2
                  id="filter-price-heading"
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Price range
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  Drag both handles, then apply to filter by asking price.
                </p>
                <p className="mb-4 text-center text-sm font-semibold tabular-nums text-foreground">
                  {formatPrice(priceRangeDraft[0])} —{" "}
                  {formatPrice(priceRangeDraft[1])}
                </p>
                <Slider
                  value={priceRangeDraft}
                  onValueChange={(v) =>
                    setPriceRangeDraft([
                      v[0] ?? FEED_PRICE_MIN,
                      v[1] ?? FEED_PRICE_MAX,
                    ])
                  }
                  min={FEED_PRICE_MIN}
                  max={FEED_PRICE_MAX}
                  step={500}
                  minStepsBetweenThumbs={1}
                  className="touch-pan-y py-2"
                  aria-label="Filter by price range"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{formatPrice(FEED_PRICE_MIN)}</span>
                  <span>{formatPrice(FEED_PRICE_MAX)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-0 flex-1 rounded-xl"
                    disabled={
                      priceRangeDraft[0] === FEED_PRICE_MIN &&
                      priceRangeDraft[1] === FEED_PRICE_MAX
                    }
                    onClick={() =>
                      setPriceRangeDraft([FEED_PRICE_MIN, FEED_PRICE_MAX])
                    }
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    className="min-w-0 flex-1 rounded-xl"
                    onClick={() => setPriceRange(priceRangeDraft)}
                  >
                    Apply price
                  </Button>
                </div>
              </section>

              {sellerFilterBadges.length > 0 ? (
                <>
                  <Separator />
                  <section aria-labelledby="filter-seller-heading">
                    <h2
                      id="filter-seller-heading"
                      className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Seller
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {sellerFilterBadges.map((badge) => (
                        <Button
                          key={badge}
                          variant={
                            sellerBadgeFilter === badge ? "default" : "outline"
                          }
                          size="sm"
                          type="button"
                          onClick={() =>
                            setSellerBadgeFilter(
                              sellerBadgeFilter === badge ? null : badge,
                            )
                          }
                          className="rounded-full"
                        >
                          <Star className="size-3.5" />
                          {SELLER_BADGE_LABEL[badge] ?? badge}
                        </Button>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          </div>

          <DrawerFooter className="border-t border-border bg-background">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 rounded-xl"
                disabled={!hasFilters}
                onClick={clearFilters}
              >
                <X className="mr-1.5 size-3.5" />
                Clear all
              </Button>
              <DrawerClose asChild>
                <Button type="button" className="min-w-0 flex-1 rounded-xl">
                  Done
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="p-3">
          <Card className="py-0">
            <CardContent className="px-4 py-16 text-center">
              {initialListings.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-foreground">No listings yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run <code className="rounded bg-muted px-1">npm run db:seed</code> with{' '}
                    <code className="rounded bg-muted px-1">DATABASE_URL</code> set, then refresh.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">No listings found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : viewMode === "feed" ? (
        // ── Feed view ──────────────────────────────────────────────────────────
        <div className="flex flex-col gap-3 bg-white p-3">
          {visibleListings.map((listing) => {
            const liked = likedListingIds.has(listing.id);
            const saved = savedIds.has(listing.id);
            const likeCount = displayListingLikes(listing.id, listing.likes);
            const allComments = commentsByListing[listing.id] ?? [];
            const sortedComments = [...allComments]
              .map((c) => ({
                ...c,
                effectiveLikes: displayCommentLikes(c.id, c.likes),
              }))
              .sort((a, b) => b.effectiveLikes - a.effectiveLikes);
            const topComments = sortedComments.slice(0, 3);
            const remainingComments = sortedComments.slice(3);
            const commentDraft = commentDrafts[listing.id] ?? "";

            return (
              <Card key={listing.id} className="gap-0 border border-white/80 py-0 shadow-[0_8px_22px_rgba(11,19,43,0.16)]">
                <CardHeader className="border-b px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/design/u/${listing.seller.handle}`}
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar className="bg-foreground text-background after:border-foreground/10">
                        <AvatarImage
                          src={listing.seller.avatar}
                          alt={listing.seller.name}
                        />
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
                          onClick={(e) => e.stopPropagation()}
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </CardHeader>

                <div className="w-full overflow-hidden bg-muted">
                  <PhotoCarousel photos={listing.photos} alt={listing.model} />
                </div>

                <CardContent className="px-4 pt-3 pb-3">
                  <div className="mb-3 flex flex-col gap-1">
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(listing.price)}
                    </span>
                    <CardTitle className="text-base font-semibold leading-snug">
                      {listing.model}
                    </CardTitle>
                  </div>
                  <Collapsible
                    open={expandedDescIds.has(listing.id)}
                    onOpenChange={(open) => {
                      setExpandedDescIds((prev) => {
                        const next = new Set(prev);
                        if (open) next.add(listing.id);
                        else next.delete(listing.id);
                        return next;
                      });
                    }}
                  >
                    <CardDescription
                      className={cn(
                        "text-sm leading-relaxed text-foreground/75",
                        !expandedDescIds.has(listing.id) && "line-clamp-2",
                      )}
                    >
                      {listing.description}
                    </CardDescription>
                    <CollapsibleTrigger className="mt-1 cursor-pointer bg-transparent px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {expandedDescIds.has(listing.id)
                        ? "See less"
                        : "See more"}
                    </CollapsibleTrigger>
                  </Collapsible>
                </CardContent>

                {/* Inline comments */}
                <div className="border-t px-4 pt-3 pb-2">
                  {topComments.length > 0 ? (
                    <Collapsible
                      open={expandedCommentsIds.has(listing.id)}
                      onOpenChange={(open) => {
                        if (open) void ensureCommentsLoaded(listing.id);
                        setExpandedCommentsIds((prev) => {
                          const next = new Set(prev);
                          if (open) next.add(listing.id);
                          else next.delete(listing.id);
                          return next;
                        });
                      }}
                    >
                      <div className="mb-3 flex flex-col gap-2.5">
                        {topComments.map((comment) => (
                          <DesignListingCommentRow
                            key={comment.id}
                            comment={comment}
                            liked={likedCommentIds.has(comment.id)}
                            onToggleLike={() => void toggleCommentLike(comment.id)}
                            onDelete={
                              isViewerAuthoredComment(comment, viewer?.id)
                                ? () => void deleteComment(listing.id, comment.id)
                                : undefined
                            }
                            variant="feed"
                          />
                        ))}

                        {remainingComments.length > 0 && (
                          <>
                            <CollapsibleContent>
                              <div className="flex flex-col gap-2.5">
                                {remainingComments.map((comment) => (
                                  <DesignListingCommentRow
                                    key={comment.id}
                                    comment={comment}
                                    liked={likedCommentIds.has(comment.id)}
                                    onToggleLike={() =>
                                      void toggleCommentLike(comment.id)
                                    }
                                    onDelete={
                                      isViewerAuthoredComment(comment, viewer?.id)
                                        ? () =>
                                            void deleteComment(
                                              listing.id,
                                              comment.id,
                                            )
                                        : undefined
                                    }
                                    variant="feed"
                                  />
                                ))}
                              </div>
                            </CollapsibleContent>
                            <CollapsibleTrigger className="cursor-pointer bg-transparent text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                              {expandedCommentsIds.has(listing.id)
                                ? "Show less"
                                : `View all ${allComments.length} comments`}
                            </CollapsibleTrigger>
                          </>
                        )}
                      </div>
                    </Collapsible>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Input
                      value={commentDraft}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [listing.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void addComment(listing.id);
                        }
                      }}
                      placeholder="Add a comment…"
                      className="h-8 flex-1 rounded-full bg-muted/40 px-3.5 text-xs"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={!commentDraft.trim()}
                      onClick={() => void addComment(listing.id)}
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
                    aria-label={`${liked ? "Unlike" : "Like"} listing, ${likeCount} likes`}
                    className={cn(
                      "h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      liked && "text-primary",
                    )}
                  >
                    <Heart
                      className={cn("size-[18px]", liked && "fill-current")}
                    />
                    <span>{likeCount}</span>
                  </Button>
                  <Separator orientation="vertical" className="my-3 h-auto" />
                  {viewer?.id && listing._sellerId === viewer.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled
                      className="h-11 flex-1 cursor-not-allowed rounded-none text-muted-foreground/40 opacity-50"
                      aria-label="Cannot reply on your own listing"
                    >
                      <Reply className="size-[18px] -scale-x-100" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      asChild
                      className="h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    >
                      <Link href={designDmReplyHref(listing.id)} aria-label="Reply to seller">
                        <Reply className="size-[18px] -scale-x-100" />
                      </Link>
                    </Button>
                  )}
                  <Separator orientation="vertical" className="my-3 h-auto" />
                  <Button
                    variant="ghost"
                    onClick={(event) => handleSaveListing(listing.id, event)}
                    aria-label={saved ? "Unsave listing" : "Save listing"}
                    className={cn(
                      "h-11 flex-1 rounded-none text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      saved && "text-primary",
                    )}
                  >
                    <Bookmark
                      className={cn("size-[18px]", saved && "fill-current")}
                    />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          {skeletonSlotCount > 0
            ? Array.from({ length: skeletonSlotCount }).map((_, i) => (
                <FeedListingSkeleton key={`feed-skel-${visibleCount}-${i}`} />
              ))
            : null}
          {hasMore || isLoadingMore ? (
            <div
              ref={loadMoreSentinelRef}
              className="h-8 w-full shrink-0"
              aria-hidden
            />
          ) : null}
        </div>
      ) : (
        // ── Grid view ──────────────────────────────────────────────────────────
        <div className="grid grid-cols-2 gap-2 p-2">
          {visibleListings.map((listing) => {
            const liked = likedListingIds.has(listing.id);
            const saved = savedIds.has(listing.id);
            const likeCount = displayListingLikes(listing.id, listing.likes);

            return (
              <div
                key={listing.id}
                role="button"
                tabIndex={0}
                onClick={() => setDrawerListing(listing)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setDrawerListing(listing);
                }}
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
                    {listing.seller.badges.includes("world-verified") && (
                      <span
                        className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-world-verified"
                        aria-label="World Verified"
                      >
                        <WorldOrbIcon className="size-2 text-white" />
                      </span>
                    )}
                    {listing.seller.badges.includes("power-seller") && (
                      <Star
                        className="size-3 shrink-0 fill-primary text-primary"
                        aria-label="Power Seller"
                      />
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-sm font-bold leading-none text-foreground">
                    {formatPrice(listing.price)}
                  </p>

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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(listing.id, e);
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
                        liked
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-label={liked ? "Unlike" : "Like"}
                    >
                      <Heart
                        className={cn("size-4", liked && "fill-current")}
                      />
                      {likeCount}
                    </button>

                    {viewer?.id && listing._sellerId === viewer.id ? (
                      <span
                        className="flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/35"
                        aria-label="Cannot reply on your own listing"
                      >
                        <Reply className="size-4 -scale-x-100" />
                      </span>
                    ) : (
                      <Link
                        href={designDmReplyHref(listing.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Reply to seller"
                      >
                        <Reply className="size-4 -scale-x-100" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleSaveListing(listing.id);
                      }}
                      className={cn(
                        "ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors",
                        saved
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-label={saved ? "Unsave" : "Save"}
                    >
                      <Bookmark
                        className={cn("size-4", saved && "fill-current")}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {skeletonSlotCount > 0
            ? Array.from({ length: skeletonSlotCount }).map((_, i) => (
                <GridListingSkeleton key={`grid-skel-${visibleCount}-${i}`} />
              ))
            : null}
          {hasMore || isLoadingMore ? (
            <div
              ref={loadMoreSentinelRef}
              className="col-span-2 h-8 w-full shrink-0"
              aria-hidden
            />
          ) : null}
        </div>
      )}

      {/* ── Listing detail drawer (grid mode) ── */}
      {drawerResident ? (
        <ListingDetailDrawer
          listing={drawerResident}
          open={drawerListing !== null}
          onOpenChange={(open) => {
            if (!open) setDrawerListing(null);
            else void ensureCommentsLoaded(drawerResident.id);
          }}
          liked={likedListingIds.has(drawerResident.id)}
          likeCount={displayListingLikes(drawerResident.id, drawerResident.likes)}
          onToggleLike={() => void toggleListingLike(drawerResident.id)}
          saved={savedIds.has(drawerResident.id)}
          onToggleSave={() => void toggleSaveListing(drawerResident.id)}
          comments={drawerComments}
          commentLikedIds={likedCommentIds}
          onToggleCommentLike={(id) => void toggleCommentLike(id)}
          onDeleteComment={(commentId) =>
            void deleteComment(drawerResident.id, commentId)
          }
          commentDraft={commentDrafts[drawerResident.id] ?? ""}
          onCommentDraftChange={(val) =>
            setCommentDrafts((prev) => ({ ...prev, [drawerResident.id]: val }))
          }
          onAddComment={() => void addComment(drawerResident.id)}
        />
      ) : null}
    </div>
  );
}
