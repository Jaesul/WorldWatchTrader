"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingEditDrawer } from "@/components/design/ListingEditDrawer";
import { MarkSoldSheet } from "@/components/design/MarkSoldSheet";
import { Verify } from "@/components/Verify";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import { type MyListing, type ListingStatus } from "@/lib/design/listing-store";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useViewerDashboardListingsInfinite } from "@/lib/design/use-viewer-dashboard-listings-infinite";
import { STATUS_CONFIG } from "@/lib/design/listing-status-config";
import { blockDesignInteractionWithoutWorldId } from "@/lib/design/world-id-interaction-gate";

type ProfileTab = "active" | "pending" | "history";

function formatPrice(price: number, currency: string) {
  const symbol =
    currency === "EUR"
      ? "€"
      : currency === "GBP"
        ? "£"
        : currency === "CHF"
          ? "CHF "
          : "$";
  return symbol + price.toLocaleString("en-US");
}

function ListingCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Skeleton className="size-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-[55%] max-w-[200px]" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
    </div>
  );
}

function ListingCard({
  listing,
  onOpen,
}: {
  listing: MyListing;
  onOpen: () => void;
}) {
  const cfg = STATUS_CONFIG[listing.status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-card/80"
    >
      <img
        src={listing.photo}
        alt={listing.model}
        className="size-12 shrink-0 rounded-lg object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{listing.model}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(listing.price, listing.currency)}
          {listing.condition ? ` · ${listing.condition}` : ""}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">{listing.postedAt}</p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}
      >
        {cfg.label}
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const { viewer, allViewers, allViewersLoading, ensureAllViewersLoaded, setViewerId } =
    useDesignViewer();
  const orbGate = { viewerOrbVerified: viewer?.orbVerified === true };
  const [sessionViewer, setSessionViewer] = useState<{
    id: string;
    orbVerified: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("active");
  const [selectedListing, setSelectedListing] = useState<MyListing | null>(null);
  const [soldSheetListing, setSoldSheetListing] = useState<MyListing | null>(null);

  const {
    listings: allListings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useViewerDashboardListingsInfinite(15);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (
          hit &&
          hasMoreRef.current &&
          !isLoadingMoreRef.current
        ) {
          void loadMoreRef.current();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allListings.length, activeTab]);

  useEffect(() => {
    void ensureAllViewersLoaded();
  }, [ensureAllViewersLoaded]);

  useEffect(() => {
    if (viewer?.orbVerified) {
      setSessionViewer(null);
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => null)) as
          | { user?: { id?: string; orbVerified?: boolean } }
          | null;
        if (!cancelled) {
          setSessionViewer(
            typeof data?.user?.id === "string"
              ? {
                  id: data.user.id,
                  orbVerified: Boolean(data.user.orbVerified),
                }
              : null,
          );
        }
      } catch {
        if (!cancelled) setSessionViewer(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewer?.orbVerified]);

  const persistStatusChange = useCallback(async (listingId: string, status: ListingStatus) => {
    const r = await fetch(`/api/design/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) {
      toast.error(typeof j.error === "string" ? j.error : "Update failed");
      throw new Error("persist failed");
    }
    await refresh();
  }, [refresh]);

  const activeListings = allListings.filter(
    (l) => l.status === "active" || l.status === "draft",
  );
  const pendingListings = allListings.filter((l) => l.status === "pending");
  const historyListings = allListings.filter(
    (l) => l.status === "sold" || l.status === "archived",
  );

  const tabs: { id: ProfileTab; label: string; count: number }[] = [
    { id: "active", label: "Active", count: activeListings.length },
    { id: "pending", label: "Pending", count: pendingListings.length },
    { id: "history", label: "History", count: historyListings.length },
  ];

  const visibleListings =
    activeTab === "active"
      ? activeListings
      : activeTab === "pending"
        ? pendingListings
        : historyListings;

  const emptyMessages: Record<ProfileTab, { title: string; body: string }> = {
    active: {
      title: "No active listings",
      body: "Post your first watch to get started.",
    },
    pending: {
      title: "No pending listings",
      body: "Mark a listing as Pending when a deal is in progress.",
    },
    history: {
      title: "No history yet",
      body: "Sold and archived listings appear here.",
    },
  };

  const memberSinceLabel = useMemo(() => {
    if (!viewer) return "";
    return new Date(viewer.memberSinceMs).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [viewer]);

  const avatarUrl =
    viewer?.profilePictureUrl ??
    "https://i.pravatar.cc/150?u=design-profile";
  const canVerifySignedInUser = !!sessionViewer && !sessionViewer.orbVerified;
  const isViewingSignedInUser =
    !!viewer && !!sessionViewer && viewer.id === sessionViewer.id;

  if (!viewer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No users in the database yet. Sign in once, then refresh this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      {error ? (
        <p className="px-4 py-2 text-center text-xs text-rose-600">{error}</p>
      ) : null}

      {(allViewersLoading || allViewers.length > 0) && (
        <div className="border-b border-border px-4 pb-3">
          <label
            htmlFor="design-viewer-select"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Design sandbox user
          </label>
          <select
            id="design-viewer-select"
            className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            value={viewer.id}
            onChange={(e) => void setViewerId(e.target.value)}
            disabled={allViewersLoading && allViewers.length === 0}
          >
            {allViewers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.username}
                {v.handle ? ` (@${v.handle})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative px-4 pb-4 pt-0">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt={viewer.username}
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{viewer.username}</h1>
              {viewer.handle ? (
                <span className="text-xs text-muted-foreground">@{viewer.handle}</span>
              ) : null}
              {viewer.orbVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-world-verified/15 px-2 py-0.5 text-[10px] font-semibold text-world-verified">
                  <WorldOrbIcon className="size-3 shrink-0" />
                  World Verified
                </span>
              ) : null}
              {viewer.powerSeller ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Power Seller
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Member since {memberSinceLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{activeListings.length}</span>{" "}
                active
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            type="button"
            disabled
            title="Profile is DB-backed in the sandbox; editing comes with NextAuth wiring."
          >
            Edit
          </Button>
        </div>

        <p className="mt-3 break-all text-xs text-muted-foreground">{viewer.walletAddress}</p>
      </div>

      {canVerifySignedInUser && (
        <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
          <p className="text-sm font-semibold text-world-verified">Verify with World ID</p>
          <p className="mt-0.5 text-xs text-foreground/70">
            {isViewingSignedInUser
              ? "If you became orb verified after logging in, verify here to refresh your badge on this account."
              : "You're signed in with a different account. Verifying here will update your signed-in account, not the sandbox profile currently selected above."}
          </p>
          {!isViewingSignedInUser && sessionViewer ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void setViewerId(sessionViewer.id)}
              >
                Switch to your profile
              </Button>
            </div>
          ) : null}
          <div className="mt-3">
            <Verify
              action="test-action"
              showHeading={false}
              onVerified={() =>
                setSessionViewer((current) =>
                  current ? { ...current, orbVerified: true } : current,
                )
              }
            />
          </div>
        </div>
      )}

      {viewer.orbVerified && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-world-verified/30 bg-world-verified/10 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground">
            <WorldOrbIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-world-verified">World ID verified</p>
            <p className="text-xs text-world-verified/70">
              Orb verification on this account in the database.
            </p>
          </div>
        </div>
      )}

      <div className="border-b border-border">
        <div className="flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    activeTab === tab.id
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleListings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">{emptyMessages[activeTab].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyMessages[activeTab].body}</p>
            {activeTab === "active" && (
              <Button className="mt-4" size="sm" asChild>
                <Link
                  href="/design/post"
                  onClick={(e) => {
                    if (blockDesignInteractionWithoutWorldId(orbGate)) e.preventDefault();
                  }}
                >
                  Post a listing
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpen={() => {
                  if (blockDesignInteractionWithoutWorldId(orbGate)) return;
                  setSelectedListing(listing);
                }}
              />
            ))}
            {activeTab === "active" && (
              <Button variant="outline" size="sm" className="mt-1 w-full" asChild>
                <Link
                  href="/design/post"
                  onClick={(e) => {
                    if (blockDesignInteractionWithoutWorldId(orbGate)) e.preventDefault();
                  }}
                >
                  + Add listing
                </Link>
              </Button>
            )}
            {hasMore && visibleListings.length > 0 ? (
              <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            ) : null}
            {isLoadingMore ? (
              <div className="space-y-2 pt-1">
                <ListingCardSkeleton />
                <ListingCardSkeleton />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedListing ? (
        <ListingEditDrawer
          key={selectedListing.id}
          listing={selectedListing}
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onRequestSold={(l) => setSoldSheetListing(l)}
          onAfterMutate={() => refresh()}
        />
      ) : null}

      {soldSheetListing ? (
        <MarkSoldSheet
          open={!!soldSheetListing}
          onOpenChange={(open) => {
            if (!open) setSoldSheetListing(null);
          }}
          listing={soldSheetListing}
          previousStatus={soldSheetListing.status}
          persistStatusChange={persistStatusChange}
          onSold={() => setSoldSheetListing(null)}
        />
      ) : null}
    </div>
  );
}
