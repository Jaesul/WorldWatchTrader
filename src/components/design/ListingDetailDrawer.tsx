"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Reply,
  Send,
  Share2,
} from "lucide-react";

import { DesignListingCommentRow } from "@/components/design/DesignListingCommentRow";
import {
  BadgeChip,
  SellerInitials,
} from "@/components/design/seller-listing-badge-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice, type Listing } from "@/lib/design/data";
import { designDmReplyHref } from "@/lib/design/dm-reply";
import type { DesignFeedListing } from "@/lib/design/map-db-feed-to-listing";
import {
  isViewerAuthoredComment,
  type RichComment,
} from "@/lib/design/listing-drawer-comments";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { guardBooleanOpenChange } from "@/lib/guard-boolean-open-change";
import { blockDesignInteractionWithoutWorldId } from "@/lib/design/world-id-interaction-gate";
import { cn } from "@/lib/utils";

export type ListingDetailDrawerProps = {
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
  /** Remove a comment authored by the current user (design sandbox: author "You"). */
  onDeleteComment?: (commentId: string) => void;
  commentDraft: string;
  onCommentDraftChange: (val: string) => void;
  onAddComment: () => void;
  /** Opens the design share sheet (iOS-style export + in-app send). */
  onRequestShare?: () => void;
  /** Public profile sold history: no reply CTA; comments are read-only. */
  soldHistory?: { soldAtLabel: string };
};

export function ListingPhotoCarousel({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
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

export function ListingDetailDrawer({
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
  onDeleteComment,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
  onRequestShare,
  soldHistory,
}: ListingDetailDrawerProps) {
  const { viewer } = useDesignViewer();
  const orbGate = { viewerOrbVerified: viewer?.orbVerified === true };
  const isOwnListing = Boolean(
    viewer?.id &&
      "_sellerId" in listing &&
      (listing as DesignFeedListing)._sellerId === viewer.id,
  );
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (open) setDescExpanded(false);
  }, [listing.id, open]);

  const interactionLocked = !!soldHistory;

  function runUnlessSoldHistory(fn: () => void) {
    if (interactionLocked) {
      fn();
      return;
    }
    if (blockDesignInteractionWithoutWorldId(orbGate)) return;
    fn();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl border-x px-0 pb-0"
      >
        <SheetTitle className="sr-only">{listing.model}</SheetTitle>
        <SheetDescription className="sr-only">
          Full listing details for {listing.model}
        </SheetDescription>

        <div className="relative flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          {onRequestShare ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Share listing"
              onClick={() => runUnlessSoldHistory(() => onRequestShare())}
            >
              <Share2 className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {soldHistory ? (
            <div className="mx-4 mt-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2.5 text-center">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                Settled on-chain via app escrow
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Sold {soldHistory.soldAtLabel}
              </p>
            </div>
          ) : null}
          <div className="overflow-hidden bg-muted">
            <ListingPhotoCarousel photos={listing.photos} alt={listing.model} />
          </div>

          <div className="px-4 pt-4 pb-2">
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-xl font-bold text-foreground">
                {formatPrice(listing.price)}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />
                {listing.postedAt}
              </div>
            </div>

            <h2 className="mb-2 text-base font-semibold leading-snug text-foreground">
              {listing.model}
            </h2>

            <Collapsible
              open={descExpanded}
              onOpenChange={guardBooleanOpenChange(setDescExpanded)}
            >
              <p
                className={cn(
                  "text-sm leading-relaxed text-foreground/75",
                  !descExpanded && "line-clamp-3",
                )}
              >
                {listing.description}
              </p>
              <CollapsibleTrigger className="mt-1 cursor-pointer bg-transparent px-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {descExpanded ? "See less" : "See more"}
              </CollapsibleTrigger>
            </Collapsible>

            <Link
              href={`/design/u/${listing.seller.handle}`}
              className="mt-4 mb-4 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <Avatar className="size-9 bg-foreground text-background after:border-foreground/10">
                <AvatarImage
                  src={listing.seller.avatar}
                  alt={listing.seller.name}
                />
                <AvatarFallback className="bg-foreground text-xs font-semibold text-background">
                  <SellerInitials name={listing.seller.name} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {listing.seller.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {listing.seller.badges.slice(0, 2).map((b) => (
                    <BadgeChip key={b} badge={b} />
                  ))}
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-4 shrink-0 text-muted-foreground/50"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {soldHistory ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Listing ended · {soldHistory.soldAtLabel}
                </span>
              ) : isOwnListing ? (
                <Button
                  type="button"
                  size="sm"
                  disabled
                  className="shrink-0 cursor-not-allowed rounded-full opacity-50"
                  aria-label="Cannot reply on your own listing"
                >
                  <Reply className="size-3.5 -scale-x-100" />
                  Reply to seller
                </Button>
              ) : (
                <Button asChild size="sm" className="shrink-0 rounded-full">
                  <Link
                    href={designDmReplyHref(listing.id)}
                    onClick={(e) => {
                      if (blockDesignInteractionWithoutWorldId(orbGate)) {
                        e.preventDefault();
                        return;
                      }
                    }}
                  >
                    <Reply className="size-3.5 -scale-x-100" />
                    Reply to seller
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 rounded-full",
                  liked &&
                    "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  runUnlessSoldHistory(onToggleLike);
                }}
              >
                <Heart className={cn("size-3.5", liked && "fill-current")} />
                {likeCount}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 rounded-full",
                  saved &&
                    "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                )}
                onClick={() => runUnlessSoldHistory(onToggleSave)}
              >
                <Bookmark className={cn("size-3.5", saved && "fill-current")} />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="px-4 pt-3 pb-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comments
            </p>
            {comments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                  <DesignListingCommentRow
                    key={comment.id}
                    comment={comment}
                    liked={commentLikedIds.has(comment.id)}
                    onToggleLike={() =>
                      runUnlessSoldHistory(() => onToggleCommentLike(comment.id))
                    }
                    onDelete={
                      onDeleteComment && isViewerAuthoredComment(comment, viewer?.id)
                        ? () =>
                            runUnlessSoldHistory(() => onDeleteComment(comment.id))
                        : undefined
                    }
                    variant="drawer"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="shrink-0 border-t px-4 py-3"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          {soldHistory ? (
            <p className="text-center text-xs text-muted-foreground">
              Comments are read-only for sold listings.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={commentDraft}
                onChange={(e) => onCommentDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    runUnlessSoldHistory(onAddComment);
                  }
                }}
                placeholder="Add a comment…"
                className="h-9 flex-1 rounded-full bg-muted/40 px-4 text-sm"
                autoFocus={false}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={!commentDraft.trim()}
                onClick={() => runUnlessSoldHistory(onAddComment)}
                aria-label="Post comment"
                className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Send className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
