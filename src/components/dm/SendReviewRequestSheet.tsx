'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { DmReviewRequestSnapshotPayload } from '@/hooks/useDmThreadStream';

type LinkableDeal = {
  dealId: string;
  listingId: string;
  title: string;
  priceUsd: number;
  confirmedAt: string | null;
  imageUrl: string | null;
  existingRequestId: string | null;
  existingRequestStatus: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  onSent?: (request: DmReviewRequestSnapshotPayload) => void;
};

export function SendReviewRequestSheet({ open, onOpenChange, threadId, onSent }: Props) {
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState<LinkableDeal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedDealId(null);
    void (async () => {
      try {
        const res = await fetch(`/api/design/dm/threads/${threadId}/review-requests`, { credentials: 'include' });
        const data = (await res.json().catch(() => ({}))) as { deals?: LinkableDeal[] };
        setDeals(Array.isArray(data.deals) ? data.deals : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, threadId]);

  async function onSubmit() {
    if (!selectedDealId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/design/dm/threads/${threadId}/review-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingDealId: selectedDealId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        request?: DmReviewRequestSnapshotPayload;
        error?: string;
      };
      if (!res.ok || !data.request) {
        toast.error(typeof data.error === 'string' ? data.error : 'Could not send review request');
        return;
      }
      toast.success('Review request sent');
      onSent?.(data.request);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const availableDeals = deals.filter((d) => !d.existingRequestId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-5">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Send review request</SheetTitle>
          <SheetDescription className="text-xs">
            Ask the buyer to leave a signed review for a completed transaction.
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading completed transactions…</p>
        ) : availableDeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No eligible completed transactions in this thread.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {availableDeals.map((d) => {
                const selected = d.dealId === selectedDealId;
                return (
                  <button
                    key={d.dealId}
                    type="button"
                    onClick={() => setSelectedDealId(d.dealId)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selected ? 'border-foreground bg-foreground/5' : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <img src={d.imageUrl ?? ''} alt="" className="size-11 shrink-0 rounded-lg object-cover bg-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground">${d.priceUsd.toLocaleString('en-US')}</p>
                    </div>
                    {selected ? <Check className="size-4 shrink-0 text-foreground" /> : null}
                  </button>
                );
              })}
            </div>
            <Button type="button" className="mt-5 w-full" disabled={!selectedDealId || submitting} onClick={() => void onSubmit()}>
              {submitting ? 'Sending…' : 'Send review request'}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

