"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type MyListing, type ListingStatus } from "@/lib/design/listing-store";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useViewerDashboardListings } from "@/lib/design/use-viewer-dashboard-listings";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; description: string; color: string }
> = {
  draft: {
    label: "Draft",
    description: "Not yet published — invisible in feed",
    color: "bg-muted text-muted-foreground border-border",
  },
  active: {
    label: "Active",
    description: "Live in feed — open for messages",
    color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  },
  pending: {
    label: "Pending",
    description: "Deal in progress — hidden from feed",
    color: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  },
  sold: {
    label: "Sold",
    description: "Transaction complete — moved to history",
    color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  },
  archived: {
    label: "Archived",
    description: "Manually removed — no review triggered",
    color: "bg-muted text-muted-foreground/60 border-border/60",
  },
};

type ProfileTab = "active" | "history";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Listing card ──────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onOpen,
}: {
  listing: MyListing;
  onOpen?: () => void;
}) {
  const cfg = STATUS_CONFIG[listing.status];
  const inner = (
    <>
      <img
        src={listing.photo}
        alt={listing.model}
        className="size-12 shrink-0 rounded-lg object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {listing.model}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(listing.price, listing.currency)}
          {listing.condition ? ` · ${listing.condition}` : ""}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
          {listing.postedAt}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}
      >
        {cfg.label}
      </span>
    </>
  );
  const className =
    "flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-card/80";
  if (!onOpen) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <button type="button" onClick={onOpen} className={className}>
      {inner}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { viewer, allViewers, setViewerId } = useDesignViewer();
  const [activeTab, setActiveTab] = useState<ProfileTab>("active");

  const allListings = useViewerDashboardListings();

  const activeListings = allListings.filter(
    (l) => l.status === "active" || l.status === "draft",
  );
  const historyListings = allListings.filter(
    (l) => l.status === "sold" || l.status === "archived",
  );

  const tabs: { id: ProfileTab; label: string; count: number }[] = [
    { id: "active", label: "Active", count: activeListings.length },
    { id: "history", label: "History", count: historyListings.length },
  ];

  const visibleListings =
    activeTab === "active" ? activeListings : historyListings;

  const emptyMessages: Record<ProfileTab, { title: string; body: string }> = {
    active: {
      title: "No active listings",
      body: "Post your first watch to get started.",
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
      {allViewers.length > 0 && (
        <div className="border-b border-border px-4 py-3">
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

      {/* Profile header */}
      <div className="relative px-4 pb-4 pt-6">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt={viewer.username}
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {viewer.username}
              </h1>
              {viewer.handle ? (
                <span className="text-xs text-muted-foreground">@{viewer.handle}</span>
              ) : null}
              {viewer.orbVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-world-verified/15 px-2 py-0.5 text-[10px] font-semibold text-world-verified">
                  <svg
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    className="size-3"
                  >
                    <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm2.78 4.47a.5.5 0 0 0-.7-.7L5.5 6.29 4.42 5.22a.5.5 0 0 0-.7.7l1.6 1.6a.5.5 0 0 0 .7 0l3-3z" />
                  </svg>
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
                <span className="font-semibold text-foreground">
                  {activeListings.length}
                </span>{" "}
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

        <p className="mt-3 break-all text-xs text-muted-foreground">
          {viewer.walletAddress}
        </p>
      </div>

      {!viewer.orbVerified && (
        <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
          <p className="text-sm font-semibold text-world-verified">
            Verify with World ID
          </p>
          <p className="mt-0.5 text-xs text-foreground/70">
            Link your World ID to unlock the World Verified badge (production flow).
          </p>
        </div>
      )}

      {viewer.orbVerified && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-world-verified/30 bg-world-verified/10 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.47a.75.75 0 10-1.06-1.06L9.25 10.94 7.28 8.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l3.99-3.99z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-world-verified">
              World ID verified
            </p>
            <p className="text-xs text-world-verified/70">
              Orb verification on this account in the database.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
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

      {/* Listing list */}
      <div className="px-4 pt-4">
        {visibleListings.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              {emptyMessages[activeTab].title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {emptyMessages[activeTab].body}
            </p>
            {activeTab === "active" && (
              <Button className="mt-4" size="sm" asChild>
                <Link href="/design/post">Post a listing</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {activeTab === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                asChild
              >
                <Link href="/design/post">+ Add listing</Link>
              </Button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
