"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingEditDrawer } from "@/components/design/ListingEditDrawer";
import { MarkSoldSheet } from "@/components/design/MarkSoldSheet";
import { CopyWalletButton } from "@/components/design/CopyWalletButton";
import { ProfileEditDrawer } from "@/components/design/ProfileEditDrawer";
import { SoldListingReceiptDrawer } from "@/components/design/SoldListingReceiptDrawer";
import { Verify } from "@/components/Verify";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import { type MyListing, type ListingStatus } from "@/lib/design/listing-store";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useViewerDashboardListingsInfinite } from "@/lib/design/use-viewer-dashboard-listings-infinite";
import { useViewerPurchases } from "@/lib/design/use-viewer-purchases";
import { blockDesignInteractionWithoutWorldId } from "@/lib/design/world-id-interaction-gate";
import { useDrawerResident } from "@/hooks/use-drawer-resident";
import { useRouteMode } from "@/lib/route-mode/RouteModeProvider";
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
    <div className="flex w-full items-center gap-3 rounded-xl bg-card">
      <Skeleton className="size-20 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-[55%] max-w-[220px]" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

const STATUS_CHIP: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "border-foreground/20 bg-foreground/5 text-foreground",
  },
  active: {
    label: "Active",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  pending: {
    label: "Pending",
    className:
      "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  },
  sold: {
    label: "Sold",
    className:
      "border-foreground/20 bg-foreground/5 text-foreground",
  },
  archived: {
    label: "Archived",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
};

function ListingCard({
  listing,
  onOpen,
}: {
  listing: MyListing;
  onOpen: () => void;
}) {
  const isSale =
    listing.perspective !== "purchase" && listing.status === "sold";
  const isPurchase = listing.perspective === "purchase";
  const isHistory = isSale || isPurchase;

  // Colour scheme:
  // - Sale (sold by viewer) + Purchase (bought by viewer): gold background
  //   with white text, so history rows read as completed transactions.
  // - Everything else: default card styling.
  const containerCls = isHistory
    ? "flex w-full items-center gap-3 rounded-xl bg-[#ffc85c] p-3 text-left text-white shadow-sm transition-colors hover:bg-[#ffc85c]/90"
    : "flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-colors hover:bg-card/80";

  const titleCls = isHistory
    ? "truncate text-base font-semibold text-white"
    : "truncate text-base font-semibold text-foreground";
  const subCls = isHistory
    ? "text-sm text-white/80"
    : "text-sm text-muted-foreground";
  const tsCls = isHistory
    ? "mt-0.5 text-xs text-white/70"
    : "mt-0.5 text-xs text-muted-foreground/60";

  const statusCfg = STATUS_CHIP[listing.status];
  const chipLabel = isSale ? "Sale" : isPurchase ? "Purchase" : statusCfg.label;
  const chipCls = isHistory
    ? "shrink-0 rounded-full border border-foreground/15 bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background"
    : `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusCfg.className}`;

  const shipment = listing.deal?.shipment ?? null;
  const shippedChipCls = isHistory
    ? "shrink-0 rounded-full border border-foreground/15 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground"
    : "shrink-0 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300";
  const shippedLabel = shipment
    ? shipment.carrierName
      ? `Shipped · ${shipment.carrierName}`
      : "Shipped"
    : null;

  return (
    <button type="button" onClick={onOpen} className={containerCls}>
      <img
        src={listing.photo}
        alt={listing.model}
        className="size-20 shrink-0 rounded-lg object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className={titleCls}>{listing.model}</p>
        <p className={subCls}>
          {formatPrice(listing.price, listing.currency)}
          {listing.condition ? ` · ${listing.condition}` : ""}
        </p>
        <p className={tsCls}>{listing.postedAt}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={chipCls}>{chipLabel}</span>
        {shippedLabel ? (
          <span className={shippedChipCls}>{shippedLabel}</span>
        ) : null}
      </div>
    </button>
  );
}

export default function ProfilePage() {
  const { viewer, allViewers, allViewersLoading, ensureAllViewersLoaded, setViewerId } =
    useDesignViewer();
  const { basePath, isSandbox } = useRouteMode();
  const orbGate = { viewerOrbVerified: viewer?.orbVerified === true };
  const [sessionViewer, setSessionViewer] = useState<{
    id: string;
    orbVerified: boolean;
  } | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("active");
  const [selectedListing, setSelectedListing] = useState<MyListing | null>(null);
  const [soldSheetListing, setSoldSheetListing] = useState<MyListing | null>(null);
  const [receiptListing, setReceiptListing] = useState<MyListing | null>(null);
  /** Cached values that survive past close so drawer exit animations can play. */
  const selectedListingResident = useDrawerResident(selectedListing);
  const soldSheetListingResident = useDrawerResident(soldSheetListing);

  const {
    listings: allListings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useViewerDashboardListingsInfinite(15);

  const { purchases, isLoading: purchasesLoading } = useViewerPurchases();

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
    // Main route: the viewer IS the signed-in user, no extra session fetch.
    if (!isSandbox) {
      setSessionViewer(
        viewer?.id
          ? { id: viewer.id, orbVerified: Boolean(viewer.orbVerified) }
          : null,
      );
      return;
    }

    // Sandbox: only fetch the session when the picked viewer isn't orb verified
    // (we surface a CTA to switch to the signed-in account).
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
  }, [isSandbox, viewer?.id, viewer?.orbVerified]);

  const persistStatusChange = useCallback(async (listingId: string, status: ListingStatus) => {
    const r = await fetch(`/api/design/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) {
      const msg =
        typeof j.error === "string" ? j.error : "Update failed";
      throw new Error(msg);
    }
    await refresh();
  }, [refresh]);

  const activeListings = allListings.filter(
    (l) => l.status === "active" || l.status === "draft",
  );
  const pendingListings = allListings.filter((l) => l.status === "pending");
  const soldOrArchived = allListings.filter(
    (l) => l.status === "sold" || l.status === "archived",
  );
  const salesCount = allListings.filter((l) => l.status === "sold").length;
  const purchasesCount = purchases.length;
  const historyListings = useMemo(() => {
    const withSalePerspective: MyListing[] = soldOrArchived.map((l) => ({
      ...l,
      perspective: l.perspective ?? "sale",
    }));
    const merged = [...withSalePerspective, ...purchases];
    // Sort by most recent activity (confirmed deal for purchases, updatedAt
    // for sales — which maps to `postedAt` labels already carried on the row).
    merged.sort((a, b) => {
      const aTs = a.deal?.confirmedAt
        ? new Date(a.deal.confirmedAt).getTime()
        : 0;
      const bTs = b.deal?.confirmedAt
        ? new Date(b.deal.confirmedAt).getTime()
        : 0;
      if (aTs !== bTs) return bTs - aTs;
      // Fallback tie-breakers so the order is stable.
      return a.id.localeCompare(b.id);
    });
    return merged;
  }, [soldOrArchived, purchases]);

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
  const isViewingSignedInUser =
    !!viewer && !!sessionViewer && viewer.id === sessionViewer.id;
  /**
   * Main route: viewer is always the signed-in user — show verify status / CTA.
   * Sandbox: only when the picker matches the signed-in account; otherwise the
   * "Switch to your profile" block below applies.
   */
  const showVerifyCta = !isSandbox || isViewingSignedInUser;
  const showSandboxSwitchCta =
    isSandbox &&
    !!sessionViewer &&
    !sessionViewer.orbVerified &&
    !isViewingSignedInUser;

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

      {isSandbox && (allViewersLoading || allViewers.length > 0) && (
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

      <div className="relative px-4 pb-4 pt-2">
        <div className="absolute right-4 top-2 flex flex-col items-stretch gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            type="button"
            onClick={() => setProfileEditOpen(true)}
          >
            Edit
          </Button>
          {!isSandbox && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 text-xs text-muted-foreground hover:text-destructive"
              type="button"
              onClick={() => void signOut({ callbackUrl: "/welcome" })}
            >
              <LogOut className="size-3" aria-hidden />
              Sign out
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={viewer.username}
            className="size-20 shrink-0 rounded-full object-cover bg-muted ring-1 ring-border"
          />
          <div className="min-w-0 flex-1 pr-14">
            <h1 className="truncate text-lg font-semibold leading-tight text-foreground">
              {viewer.username}
            </h1>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              {viewer.handle && viewer.handle !== viewer.username ? (
                <>
                  <span className="truncate">@{viewer.handle}</span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <CopyWalletButton address={viewer.walletAddress} />
            </div>
            {viewer.orbVerified || viewer.powerSeller ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
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
            ) : null}
          </div>
        </div>

        {viewer.bio ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {viewer.bio}
          </p>
        ) : null}

        <dl className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Active listings</dt>
            <dd className="text-sm font-semibold text-foreground">
              {activeListings.length}
            </dd>
            <span>active</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Sales</dt>
            <dd className="text-sm font-semibold text-foreground">
              {salesCount}
            </dd>
            <span>{salesCount === 1 ? "sale" : "sales"}</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Purchases</dt>
            <dd className="text-sm font-semibold text-foreground">
              {purchasesCount}
            </dd>
            <span>{purchasesCount === 1 ? "purchase" : "purchases"}</span>
          </div>
          <span aria-hidden className="text-muted-foreground/40">
            •
          </span>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Member since</dt>
            <dd>Joined {memberSinceLabel}</dd>
          </div>
        </dl>
      </div>

      <ProfileEditDrawer
        open={profileEditOpen}
        onOpenChange={setProfileEditOpen}
        viewer={viewer}
        fallbackAvatarUrl={avatarUrl}
      />

      {showVerifyCta &&
        (viewer.orbVerified ? (
          <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground">
                <WorldOrbIcon className="size-4" />
              </div>
              <p className="text-sm font-semibold text-world-verified">World ID verified</p>
            </div>
            <p className="mt-2 text-xs text-foreground/70">
              Orb verification is on file for this account.
            </p>
          </div>
        ) : (
          <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground">
                <WorldOrbIcon className="size-4" />
              </div>
              <p className="text-sm font-semibold text-world-verified">Verify with World ID</p>
            </div>
            <p className="mt-2 text-xs text-foreground/70">
              Verify with the Orb to unlock the World Verified badge on your profile and
              listings.
            </p>
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
        ))}

      {showSandboxSwitchCta && (
        <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
          <p className="text-sm font-semibold text-world-verified">Verify with World ID</p>
          <p className="mt-0.5 text-xs text-foreground/70">
            You&apos;re signed in with a different account. Switch to your
            profile to verify, or pick the signed-in user from the sandbox
            picker above.
          </p>
          {sessionViewer ? (
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
        {isLoading || (activeTab === "history" && purchasesLoading) ? (
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
                  href={`${basePath}/post`}
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
                  if (
                    listing.perspective === "purchase" ||
                    listing.status === "sold"
                  ) {
                    setReceiptListing(listing);
                    return;
                  }
                  setSelectedListing(listing);
                }}
              />
            ))}
            {activeTab === "active" && (
              <Button variant="outline" size="sm" className="mt-1 w-full" asChild>
                <Link
                  href={`${basePath}/post`}
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

      {selectedListingResident ? (
        <ListingEditDrawer
          key={selectedListingResident.id}
          listing={selectedListingResident}
          open={selectedListing !== null}
          onClose={() => setSelectedListing(null)}
          onRequestSold={(l) => setSoldSheetListing(l)}
          onAfterMutate={() => refresh()}
        />
      ) : null}

      {soldSheetListingResident ? (
        <MarkSoldSheet
          open={soldSheetListing !== null}
          onOpenChange={(open) => {
            if (!open) setSoldSheetListing(null);
          }}
          listing={soldSheetListingResident}
          previousStatus={soldSheetListingResident.status}
          persistStatusChange={persistStatusChange}
          onSold={() => setSoldSheetListing(null)}
        />
      ) : null}

      <SoldListingReceiptDrawer
        open={!!receiptListing}
        onOpenChange={(open) => {
          if (!open) setReceiptListing(null);
        }}
        listing={receiptListing}
      />
    </div>
  );
}
