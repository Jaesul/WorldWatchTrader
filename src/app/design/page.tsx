'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LISTINGS, formatPrice, type Badge, type Listing } from '@/lib/design/data';


function BadgeChip({ badge }: { badge: Badge }) {
  if (badge === 'world-verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-3 shrink-0">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.28 5.47a.75.75 0 0 0-1.06-1.06L7 8.69 5.78 7.47a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.81z" />
        </svg>
        World Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-3 shrink-0">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279L12.15 9.326l.764 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.826 2.01a.75.75 0 0 1-1.088-.791l.764-4.192L.82 6.374a.75.75 0 0 1 .416-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25z" />
      </svg>
      Power Seller
    </span>
  );
}

function SellerInitials({ name }: { name: string }) {
  const parts = name.split(' ');
  return <>{(parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()}</>;
}

function ListingDrawer({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-background shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="max-h-[80dvh] overflow-y-auto px-5 pb-8 pt-2">
          <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            <img
              src={listing.photo}
              alt={listing.model}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mb-1 flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold leading-snug text-foreground">{listing.model}</h2>
            <span className="shrink-0 text-xl font-bold text-foreground">{formatPrice(listing.price)}</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{listing.condition}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{listing.boxPapers}</span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-foreground/80">{listing.description}</p>
          <Link
            href={`/design/u/${listing.seller.handle}`}
            className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-semibold">
              <SellerInitials name={listing.seller.name} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{listing.seller.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {listing.seller.badges.slice(0, 2).map((b) => <BadgeChip key={b} badge={b} />)}
              </div>
            </div>
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Reply to seller
            </Link>
            <button
              onClick={() => setLiked((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${liked ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}
            >
              <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="size-5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {listing.likes + (liked ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const BADGE_FILTERS: { key: Badge | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'world-verified', label: 'World Verified' },
  { key: 'power-seller', label: 'Power Seller' },
];

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<Badge | 'all'>('all');
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const filtered = LISTINGS.filter((l) => {
    const matchSearch =
      search.trim() === '' ||
      l.model.toLowerCase().includes(search.toLowerCase()) ||
      l.seller.name.toLowerCase().includes(search.toLowerCase());
    const matchBadge = badgeFilter === 'all' || l.seller.badges.includes(badgeFilter);
    return matchSearch && matchBadge;
  });

  function toggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-muted/30">
      {/* Search + filter bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 pb-3 pt-4">
        <div className="relative mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search watches, brands, sellers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-full border border-border bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {BADGE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setBadgeFilter(f.key as Badge | 'all')}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${badgeFilter === f.key ? 'bg-foreground text-background' : 'border border-border bg-background text-muted-foreground hover:text-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-2 py-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filtered.map((listing) => {
            const liked = likedIds.has(listing.id);

            return (
              <article key={listing.id} className="overflow-hidden bg-background shadow-sm">
                {/* ── Seller row ── */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <Link
                    href={`/design/u/${listing.seller.handle}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SellerInitials name={listing.seller.name} />
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
                      {listing.seller.badges.slice(0, 2).map((b) => <BadgeChip key={b} badge={b} />)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{listing.postedAt}</p>
                  </div>
                  <button className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                </div>

                {/* ── Photo area ── */}
                <button
                  className="relative w-full cursor-pointer overflow-hidden bg-muted"
                  onClick={() => setOpenListing(listing)}
                  aria-label={`View ${listing.model}`}
                >
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={listing.photo}
                      alt={listing.model}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>

                {/* ── Content ── */}
                <div className="px-4 pb-2 pt-3">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <p className="text-base font-bold leading-snug text-foreground">{listing.model}</p>
                    <span className="shrink-0 text-base font-bold text-foreground">{formatPrice(listing.price)}</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{listing.condition}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{listing.boxPapers}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/75">
                    <span className="line-clamp-2">{listing.description}</span>
                  </p>
                  <button
                    className="mt-0.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setOpenListing(listing)}
                  >
                    See more
                  </button>
                </div>

                {/* ── Like / comment counts ── */}
                <div className="flex items-center justify-between px-4 pb-1.5">
                  <button
                    onClick={(e) => toggleLike(listing.id, e)}
                    className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="size-3.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {listing.likes + (liked ? 1 : 0)}
                  </button>
                </div>

                {/* ── Action row ── */}
                <div className="flex items-center border-t border-border">
                  {/* Like */}
                  <button
                    onClick={(e) => toggleLike(listing.id, e)}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="size-[18px]">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Like
                  </button>

                  <div className="h-5 w-px bg-border" />

                  {/* Comment — public */}
                  <button
                    onClick={() => setOpenListing(listing)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-[18px]">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Comment
                  </button>

                  <div className="h-5 w-px bg-border" />

                  {/* Reply — private DM */}
                  <Link
                    href={`/design/messages/seller-${listing.seller.handle}?listing=${listing.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-[18px]">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Reply
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      {openListing && (
        <ListingDrawer listing={openListing} onClose={() => setOpenListing(null)} />
      )}
    </div>
  );
}
