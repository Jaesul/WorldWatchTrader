'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Search, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { WorldOrbIcon } from '@/components/icons/world-orb';
import { updateListing, type MyListing, type ListingStatus } from '@/lib/design/listing-store';
import { submitSellerReview } from '@/lib/design/review-store';
import { getThreadIdsForMyListing } from '@/lib/design/thread-store';
import { pickRandomLuxurySoldGif, showSoldLuxuryCelebration } from '@/lib/design/sold-luxury-celebration';
import { LISTINGS } from '@/lib/design/data';

// ── Platform user type & pool ──────────────────────────────────────────────

export interface PlatformUser {
  handle: string;
  name: string;
  avatar: string;
  verified: boolean;
}

const THREAD_USER_MAP: Record<string, PlatformUser> = {
  'seller-alexkim':    { handle: 'alexkim',    name: 'Alex Kim',        avatar: 'https://i.pravatar.cc/150?u=alexkim',    verified: true  },
  'seller-harbortime': { handle: 'harbortime', name: 'Harbor Time Co.', avatar: 'https://i.pravatar.cc/150?u=harbortime',  verified: true  },
  'seller-marcor':     { handle: 'marcor',     name: 'Marco R.',        avatar: 'https://i.pravatar.cc/150?u=marcor',     verified: false },
};

const ALL_PLATFORM_USERS: PlatformUser[] = Array.from(
  new Map(
    LISTINGS.map((l) => [
      l.seller.handle,
      {
        handle: l.seller.handle,
        name: l.seller.name,
        avatar: l.seller.avatar,
        verified: l.seller.badges.includes('world-verified'),
      },
    ])
  ).values()
);

// ── Sub-components ─────────────────────────────────────────────────────────

type BuyerChoice = { kind: 'platform'; user: PlatformUser } | { kind: 'off-platform' };
type Step = 'select-buyer' | 'review';

function VerifiedDot() {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-world-verified ring-1 ring-background">
      <WorldOrbIcon className="size-2 text-white" />
    </span>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: PlatformUser;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        selected ? 'border-foreground bg-foreground/5' : 'border-border bg-background hover:bg-muted/40'
      }`}
    >
      <div className="relative shrink-0">
        <img src={user.avatar} alt={user.name} className="size-9 rounded-full object-cover bg-muted" />
        {user.verified && <VerifiedDot />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">@{user.handle}</p>
      </div>
      {selected && <Check className="size-4 shrink-0 text-foreground" />}
    </button>
  );
}

function MetricRow({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onChange(true)}
          className={`flex size-9 items-center justify-center rounded-full border transition-colors ${
            value === true
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
              : 'border-border bg-background text-muted-foreground hover:border-emerald-400/60 hover:text-emerald-600'
          }`}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="size-4" />
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex size-9 items-center justify-center rounded-full border transition-colors ${
            value === false
              ? 'border-rose-500 bg-rose-500/10 text-rose-600'
              : 'border-border bg-background text-muted-foreground hover:border-rose-400/60 hover:text-rose-600'
          }`}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export interface MarkSoldSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MyListing;
  /** Status to restore on undo (the status before marking sold). */
  previousStatus?: ListingStatus;
  /** Pre-selects a buyer (e.g. when opened from a message thread). */
  prefilledBuyer?: PlatformUser | null;
  onSold?: () => void;
  /** When set, sold / undo use this (e.g. DB PATCH) instead of design `listing-store`. */
  persistStatusChange?: (listingId: string, status: ListingStatus) => Promise<void>;
}

export function MarkSoldSheet({
  open,
  onOpenChange,
  listing,
  previousStatus = 'active',
  prefilledBuyer,
  onSold,
  persistStatusChange,
}: MarkSoldSheetProps) {
  const [step, setStep] = useState<Step>('select-buyer');
  const [buyer, setBuyer] = useState<BuyerChoice | null>(
    prefilledBuyer ? { kind: 'platform', user: prefilledBuyer } : null
  );
  const [search, setSearch] = useState('');
  const [punctuality, setPunctuality] = useState<boolean | null>(null);
  const [customerService, setCustomerService] = useState<boolean | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  // Reset state each time the sheet opens
  useEffect(() => {
    if (open) {
      setStep('select-buyer');
      setBuyer(prefilledBuyer ? { kind: 'platform', user: prefilledBuyer } : null);
      setSearch('');
      setPunctuality(null);
      setCustomerService(null);
      setPersistError(null);
    }
  }, [open, prefilledBuyer]);

  // Buyers suggested from thread conversations about this listing
  const suggestedBuyers: PlatformUser[] = getThreadIdsForMyListing(listing.id)
    .map((tid) => THREAD_USER_MAP[tid])
    .filter(Boolean);

  const q = search.trim().toLowerCase();
  const searchResults: PlatformUser[] =
    q.length > 0
      ? ALL_PLATFORM_USERS.filter(
          (u) =>
            (u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q)) &&
            !suggestedBuyers.some((s) => s.handle === u.handle)
        ).slice(0, 5)
      : [];

  const selectedHandle = buyer?.kind === 'platform' ? buyer.user.handle : null;

  const selectedInSuggested =
    buyer?.kind === 'platform' && suggestedBuyers.some((s) => s.handle === buyer.user.handle);
  const selectedInSearchResults =
    buyer?.kind === 'platform' &&
    q.length > 0 &&
    searchResults.some((u) => u.handle === buyer.user.handle);
  /** Search results disappear when the field is cleared — keep the pick visible. */
  const showStandaloneSelectedBuyer =
    buyer?.kind === 'platform' && !selectedInSuggested && !selectedInSearchResults;

  async function finalize(skipReview: boolean) {
    if (!skipReview) {
      submitSellerReview({
        listingId: listing.id,
        buyerHandle: buyer?.kind === 'platform' ? buyer.user.handle : 'off-platform',
        punctuality,
        customerService,
        submittedAt: new Date().toISOString(),
      });
    }
    try {
      if (persistStatusChange) {
        await persistStatusChange(listing.id, 'sold');
      } else {
        updateListing(listing.id, { status: 'sold' });
      }
    } catch (e) {
      setPersistError(
        e instanceof Error ? e.message : 'Could not mark listing as sold.',
      );
      return;
    }
    showSoldLuxuryCelebration(pickRandomLuxurySoldGif());
    onOpenChange(false);
    onSold?.();
    toast(`"${listing.model}" marked as sold.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          void (async () => {
            try {
              if (persistStatusChange) {
                await persistStatusChange(listing.id, previousStatus);
              } else {
                updateListing(listing.id, { status: previousStatus });
              }
            } catch {
              toast.error('Could not undo.');
            }
          })();
        },
      },
    });
  }

  const buyerFirstName =
    buyer?.kind === 'platform' ? buyer.user.name.split(' ')[0] : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (typeof next !== 'boolean') return;
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-8 pt-5 max-h-[90dvh] overflow-y-auto"
      >
        {step === 'select-buyer' ? (
          <>
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Who did you sell to?</SheetTitle>
              <SheetDescription className="truncate text-xs">{listing.model}</SheetDescription>
            </SheetHeader>

            {/* Suggested buyers */}
            {suggestedBuyers.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Messaged about this listing
                </p>
                <div className="space-y-2">
                  {suggestedBuyers.map((u) => (
                    <UserRow
                      key={u.handle}
                      user={u}
                      selected={selectedHandle === u.handle}
                      onSelect={() => setBuyer({ kind: 'platform', user: u })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Search platform users
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Name or @handle…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-full border border-border bg-muted/40 pl-9 pr-9 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {searchResults.map((u) => (
                    <UserRow
                      key={u.handle}
                      user={u}
                      selected={selectedHandle === u.handle}
                      onSelect={() => {
                        setBuyer({ kind: 'platform', user: u });
                        setSearch('');
                      }}
                    />
                  ))}
                </div>
              )}
              {q.length > 0 && searchResults.length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  No users found for &ldquo;{search}&rdquo;
                </p>
              )}
            </div>

            {showStandaloneSelectedBuyer && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected buyer
                </p>
                <UserRow
                  user={buyer.user}
                  selected
                  onSelect={() => setBuyer({ kind: 'platform', user: buyer.user })}
                />
              </div>
            )}

            {/* Off-platform option */}
            <button
              onClick={() => setBuyer({ kind: 'off-platform' })}
              className={`mb-5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                buyer?.kind === 'off-platform'
                  ? 'border-foreground bg-foreground/5'
                  : 'border-border bg-background hover:bg-muted/40'
              }`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                🌐
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Off-platform sale</p>
                <p className="text-xs text-muted-foreground">Sold outside the app — no review required</p>
              </div>
              {buyer?.kind === 'off-platform' && <Check className="size-4 shrink-0 text-foreground" />}
            </button>

            {persistError ? (
              <p
                className="mb-3 text-center text-sm text-destructive"
                role="alert"
              >
                {persistError}
              </p>
            ) : null}
            <Button
              className="w-full"
              disabled={!buyer}
              onClick={() => {
                setPersistError(null);
                if (buyer?.kind === 'off-platform') {
                  void finalize(true);
                } else {
                  setStep('review');
                }
              }}
            >
              {buyer?.kind === 'off-platform' ? 'Mark as sold' : 'Continue'}
            </Button>
          </>
        ) : (
          <>
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>
                {buyerFirstName ? `How was ${buyerFirstName}?` : 'Review the sale'}
              </SheetTitle>
              <SheetDescription className="text-xs text-pretty">
                Reviews stay private and don&apos;t affect either person&apos;s rating until both parties
                have submitted a review, or 7 days after the sale — whichever comes first.
              </SheetDescription>
            </SheetHeader>

            <div className="mb-5 space-y-3">
              <MetricRow
                label="Punctuality"
                sublabel="Was the buyer responsive and paid promptly?"
                value={punctuality}
                onChange={setPunctuality}
              />
              <MetricRow
                label="Customer service"
                sublabel="Was the buyer communicative and easy to deal with?"
                value={customerService}
                onChange={setCustomerService}
              />
            </div>

            {persistError ? (
              <p
                className="mb-3 text-center text-sm text-destructive"
                role="alert"
              >
                {persistError}
              </p>
            ) : null}
            <Button
              className="w-full"
              onClick={() => {
                setPersistError(null);
                void finalize(false);
              }}
            >
              Submit review & mark as sold
            </Button>
            <button
              onClick={() => {
                setPersistError(null);
                void finalize(true);
              }}
              className="mt-3 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip review
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
