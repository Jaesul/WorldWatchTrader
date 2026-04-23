'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { updateListing, type MyListing } from '@/lib/design/listing-store';
import Link from 'next/link';

type Step = 'pick' | 'outcome';

function formatPrice(price: number, currency: string) {
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF ' : '$';
  return sym + price.toLocaleString('en-US');
}

function ListingPickRow({
  listing,
  selected,
  onSelect,
}: {
  listing: MyListing;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        selected ? 'border-foreground bg-foreground/5' : 'border-border bg-background hover:bg-muted/40'
      }`}
    >
      <img
        src={listing.photo}
        alt=""
        className="size-11 shrink-0 rounded-lg object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{listing.model}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(listing.price, listing.currency)}</p>
      </div>
      {selected && <Check className="size-4 shrink-0 text-foreground" />}
    </button>
  );
}

export interface ThreadMarkListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Only listings the user can move from active in this flow */
  activeListings: MyListing[];
  /** First name or short label for copy, e.g. "Alex" */
  chatPartnerShortName: string;
  /** Opens the existing mark-sold flow (buyer selection, optional review). */
  onRequestMarkSold: (listing: MyListing) => void;
}

export function ThreadMarkListingSheet({
  open,
  onOpenChange,
  activeListings,
  chatPartnerShortName,
  onRequestMarkSold,
}: ThreadMarkListingSheetProps) {
  const [step, setStep] = useState<Step>('pick');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('pick');
      setSelectedId(null);
    }
  }, [open]);

  const selected = selectedId ? activeListings.find((l) => l.id === selectedId) ?? null : null;

  function handlePending() {
    if (!selected) return;
    updateListing(selected.id, { status: 'pending' });
    toast(`"${selected.model}" is now pending.`);
    onOpenChange(false);
  }

  function handleSold() {
    if (!selected) return;
    onOpenChange(false);
    onRequestMarkSold(selected);
  }

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
        {step === 'pick' ? (
          <>
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Mark a listing as sold</SheetTitle>
              <SheetDescription className="text-xs">
                Pick one of your active listings for this chat. You can set it to pending (in progress) or sold next.
              </SheetDescription>
            </SheetHeader>

            {activeListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any active listings right now.
                </p>
                <Button asChild className="mt-4 w-full" variant="secondary">
                  <Link href="/design/post" onClick={() => onOpenChange(false)}>
                    Create a listing
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5 space-y-2">
                  {activeListings.map((l) => (
                    <ListingPickRow
                      key={l.id}
                      listing={l}
                      selected={selectedId === l.id}
                      onSelect={() => setSelectedId(l.id)}
                    />
                  ))}
                </div>
                <Button className="w-full" disabled={!selectedId} onClick={() => setStep('outcome')}>
                  Continue
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep('pick')}
              className="mb-3 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Change listing
            </button>
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Update status</SheetTitle>
              <SheetDescription className="line-clamp-2 text-xs">
                {selected?.model}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePending}
                className="flex w-full flex-col items-start gap-1 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="text-sm font-semibold text-foreground">Mark as pending</span>
                <span className="text-xs text-muted-foreground">
                  Serious interest or a deal in progress with {chatPartnerShortName}.
                </span>
              </button>
              <button
                type="button"
                onClick={handleSold}
                className="flex w-full flex-col items-start gap-1 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="text-sm font-semibold text-foreground">Mark as sold</span>
                <span className="text-xs text-muted-foreground">
                  Complete the sale — you&apos;ll confirm the buyer and optional review.
                </span>
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
