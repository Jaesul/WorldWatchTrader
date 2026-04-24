'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { DmTxRequestSnapshotPayload } from '@/hooks/useDmThreadStream';
import { useViewerDashboardListings } from '@/lib/design/use-viewer-dashboard-listings';
import type { MyListing } from '@/lib/design/listing-store';

const SELLABLE = new Set<MyListing['status']>(['active', 'draft', 'pending']);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  onSent?: (request: DmTxRequestSnapshotPayload) => void;
};

function formatUsd(v: number) {
  return v.toLocaleString('en-US');
}

export function SendTransactionSheet({ open, onOpenChange, threadId, onSent }: Props) {
  const all = useViewerDashboardListings();
  const listings = useMemo(
    () => all.filter((l) => SELLABLE.has(l.status)),
    [all],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priceText, setPriceText] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setPriceText('');
      setDescription('');
      setSubmitting(false);
    }
  }, [open]);

  const selected = useMemo(
    () => listings.find((l) => l.id === selectedId) ?? null,
    [listings, selectedId],
  );

  useEffect(() => {
    if (selected) {
      setPriceText(String(selected.price));
    }
  }, [selected]);

  const parsedPrice = Number.parseInt(priceText, 10);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const canSubmit = !!selected && priceValid && !submitting;

  async function onSubmit() {
    if (!selected || !priceValid) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/design/dm/threads/${threadId}/transaction-requests`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: selected.id,
            priceUsd: parsedPrice,
            description,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        request?: DmTxRequestSnapshotPayload;
        error?: string;
      };
      if (!res.ok || !data.request) {
        toast.error(
          data.error === 'duplicate_pending'
            ? 'You already have a pending request for this listing.'
            : typeof data.error === 'string'
              ? data.error
              : 'Could not send request',
        );
        return;
      }
      toast.success('Transaction request sent');
      onSent?.(data.request);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
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
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-5"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Send transaction</SheetTitle>
          <SheetDescription className="text-xs">
            Pick one of your listings, confirm the agreed-on price, and add a note
            for the buyer.
          </SheetDescription>
        </SheetHeader>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              You have no sellable listings yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Listing
              </p>
              <div className="max-h-[32dvh] space-y-2 overflow-y-auto pr-1">
                {listings.map((l) => {
                  const isSelected = selectedId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedId(l.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border bg-background hover:bg-muted/40'
                      }`}
                    >
                      <img
                        src={l.photo}
                        alt=""
                        className="size-11 shrink-0 rounded-lg object-cover bg-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {l.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${formatUsd(l.price)}
                        </p>
                      </div>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-foreground" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="tx-price"
                className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Agreed price (USD)
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-ring">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  id="tx-price"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={priceText}
                  onChange={(e) =>
                    setPriceText(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  disabled={!selected}
                  placeholder="0"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              {selected && priceValid && parsedPrice !== selected.price ? (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Listing price ${formatUsd(selected.price)}. Updating to $
                  {formatUsd(parsedPrice)}.
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <label
                htmlFor="tx-description"
                className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Description
              </label>
              <Textarea
                id="tx-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Add any notes about the sale…"
                className="mt-1 text-sm"
                disabled={!selected}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {description.length}/1000
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!canSubmit}
              onClick={() => void onSubmit()}
            >
              {submitting ? 'Sending…' : 'Send transaction request'}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
