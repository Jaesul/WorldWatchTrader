"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMyListings } from "@/lib/design/use-my-listings";
import {
  updateListing,
  removeMyListing,
  type MyListing,
  type ListingStatus,
} from "@/lib/design/listing-store";
import { MarkSoldSheet } from "@/components/design/MarkSoldSheet";
import {
  blockDesignInteractionWithoutWorldId,
  useDesignWorldIdVerified,
} from "@/lib/design/world-id-interaction-gate";
import { setWorldIdVerified } from "@/lib/design/world-id-prototype";

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITIONS = ["Unworn", "Excellent", "Good", "Fair"];
const BOX_PAPERS = ["Full set", "Box only", "Papers only", "None"];
const CURRENCIES = ["USD", "EUR", "GBP", "CHF"];

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

type ProfileTab = "active" | "pending" | "history";

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

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function ListingEditDrawer({
  listing,
  open,
  onClose,
  onRequestSold,
}: {
  listing: MyListing;
  open: boolean;
  onClose: () => void;
  onRequestSold: () => void;
}) {
  const [model, setModel] = useState(listing.model);
  const [price, setPrice] = useState(String(listing.price));
  const [currency, setCurrency] = useState(listing.currency);
  const [description, setDescription] = useState(listing.description);
  const [condition, setCondition] = useState(listing.condition);
  const [boxPapers, setBoxPapers] = useState(listing.boxPapers);
  const [status, setStatus] = useState<ListingStatus>(listing.status);
  const [showDetails, setShowDetails] = useState(false);

  const isDirty =
    model !== listing.model ||
    price !== String(listing.price) ||
    currency !== listing.currency ||
    description !== listing.description ||
    condition !== listing.condition ||
    boxPapers !== listing.boxPapers ||
    status !== listing.status;

  function handleSave() {
    if (blockDesignInteractionWithoutWorldId()) return;
    updateListing(listing.id, {
      model,
      price: parseFloat(price) || listing.price,
      currency,
      description,
      condition,
      boxPapers,
      status,
    });
    onClose();
  }

  function handleDelete() {
    if (blockDesignInteractionWithoutWorldId()) return;
    removeMyListing(listing.id);
    onClose();
  }

  // Reset local state whenever drawer opens for a (potentially different) listing
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    } else {
      setModel(listing.model);
      setPrice(String(listing.price));
      setCurrency(listing.currency);
      setDescription(listing.description);
      setCondition(listing.condition);
      setBoxPapers(listing.boxPapers);
      setStatus(listing.status);
      setShowDetails(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto">
          {/* Hero photo */}
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img
              src={listing.photo}
              alt={listing.model}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 left-4 text-xs font-medium text-white/80">
              {listing.postedAt}
            </span>
          </div>

          <DrawerHeader className="pb-0">
            <DrawerTitle>Edit listing</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-5 px-4 pb-2 pt-3">
            {/* Status */}
            <section>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Status
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {(
                  Object.entries(STATUS_CONFIG) as [
                    ListingStatus,
                    (typeof STATUS_CONFIG)[ListingStatus],
                  ][]
                ).map(([s, cfg]) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (s === "sold") {
                        if (blockDesignInteractionWithoutWorldId()) return;
                        onClose();
                        onRequestSold();
                      } else {
                        if (blockDesignInteractionWithoutWorldId()) return;
                        setStatus(s);
                      }
                    }}
                    className={`rounded-lg border px-3 py-2 text-left transition-all ${
                      status === s
                        ? cfg.color + " ring-1 ring-inset ring-current/30"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${status === s ? "" : "text-foreground"}`}
                    >
                      {cfg.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight opacity-70">
                      {cfg.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Model */}
            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Model / reference
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </section>

            {/* Price */}
            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Price
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>
            </section>

            {/* Description */}
            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </section>

            {/* Optional details toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`size-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {showDetails ? "Hide" : "Show"} optional details
              </button>
            </div>

            {showDetails && (
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <section>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Condition
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCondition(condition === c ? "" : c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          condition === c
                            ? "bg-foreground text-background"
                            : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    Box &amp; Papers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOX_PAPERS.map((bp) => (
                      <button
                        key={bp}
                        onClick={() => setBoxPapers(boxPapers === bp ? "" : bp)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          boxPapers === bp
                            ? "bg-foreground text-background"
                            : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {bp}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t border-border pt-3">
          <Button onClick={handleSave} disabled={!isDirty}>
            Save changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <button
            onClick={handleDelete}
            className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:text-rose-500 hover:underline"
          >
            Delete listing
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────

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
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-card/80"
    >
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
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const worldIdVerified = useDesignWorldIdVerified();
  const [activeTab, setActiveTab] = useState<ProfileTab>("active");
  const [selectedListing, setSelectedListing] = useState<MyListing | null>(
    null,
  );
  const [soldSheetListing, setSoldSheetListing] = useState<MyListing | null>(
    null,
  );

  const allListings = useMyListings();

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

  return (
    <div className="mx-auto max-w-lg pb-10">
      {/* Profile header */}
      <div className="relative px-4 pb-4 pt-6">
        <div className="flex items-start gap-4">
          <img
            src="https://i.pravatar.cc/150?u=me-user"
            alt="Nico K."
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Nico K.</h1>
              {worldIdVerified && (
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
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Member since Jan 2025
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">12</span> sales
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">98%</span>{" "}
                positive
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {activeListings.length}
                </span>{" "}
                active
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 text-xs">
            Edit
          </Button>
        </div>

        <p className="mt-3 text-sm text-foreground/80">
          Collector focused on vintage Rolex and modern sports watches. Based in
          NYC. Fast shipper.
        </p>
      </div>

      {/* World ID banner */}
      {!worldIdVerified && (
        <div className="mx-4 mb-4 rounded-xl border border-world-verified/35 bg-world-verified/10 p-4">
          <p className="text-sm font-semibold text-world-verified">
            Verify with World ID
          </p>
          <p className="mt-0.5 text-xs text-foreground/70">
            Link your World ID to unlock the World Verified badge.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="bg-world-verified text-world-verified-foreground hover:bg-world-verified/90"
              onClick={() => setWorldIdVerified(true)}
            >
              Link World ID
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-world-verified/40"
            >
              Learn more
            </Button>
          </div>
        </div>
      )}

      {worldIdVerified && (
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
              Your identity is verified. Badge applied to all listings.
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
                <Link
                  href="/design/post"
                  onClick={(e) => {
                    if (blockDesignInteractionWithoutWorldId()) {
                      e.preventDefault();
                    }
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
                  if (blockDesignInteractionWithoutWorldId()) return;
                  setSelectedListing(listing);
                }}
              />
            ))}
            {activeTab === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                asChild
              >
                <Link
                  href="/design/post"
                  onClick={(e) => {
                    if (blockDesignInteractionWithoutWorldId()) {
                      e.preventDefault();
                    }
                  }}
                >
                  + Add listing
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit drawer */}
      {selectedListing && (
        <ListingEditDrawer
          listing={selectedListing}
          open={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          onRequestSold={() => setSoldSheetListing(selectedListing)}
        />
      )}

      {/* Mark as sold sheet */}
      {soldSheetListing && (
        <MarkSoldSheet
          open={!!soldSheetListing}
          onOpenChange={(open) => {
            if (!open) setSoldSheetListing(null);
          }}
          listing={soldSheetListing}
          previousStatus={soldSheetListing.status}
          onSold={() => setSoldSheetListing(null)}
        />
      )}
    </div>
  );
}
