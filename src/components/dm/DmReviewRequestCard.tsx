'use client';

import type { DmReviewRequestSnapshotPayload } from '@/hooks/useDmThreadStream';

type Props = {
  request: DmReviewRequestSnapshotPayload;
  mine: boolean;
  onOpen: () => void;
};

function statusChip(status: DmReviewRequestSnapshotPayload['status']) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        cls: 'bg-amber-500/15 text-amber-700 border border-amber-500/30',
      };
    case 'completed':
      return {
        label: 'Completed',
        cls: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
      };
    case 'expired':
      return {
        label: 'Expired',
        cls: 'bg-slate-500/15 text-slate-700 border border-slate-500/30',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        cls: 'bg-rose-500/15 text-rose-700 border border-rose-500/30',
      };
  }
}

function stars(rating: number) {
  return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, Math.max(0, 5 - rating));
}

export function DmReviewRequestCard({ request, mine, onOpen }: Props) {
  const chip = statusChip(request.status);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full max-w-[280px] flex-col gap-2 rounded-2xl border p-2.5 text-left transition-colors ${
        mine
          ? 'border-white/25 bg-black/10 text-white hover:bg-black/15'
          : 'border-border bg-background text-foreground hover:bg-muted/40'
      }`}
      aria-label="Open review request"
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${mine ? 'text-white/80' : 'text-muted-foreground'}`}>
          Review request
        </p>
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${chip.cls}`}>
          {chip.label}
        </span>
      </div>
      <div className="flex gap-2.5">
        <div className={`relative size-14 shrink-0 overflow-hidden rounded-lg ${mine ? 'bg-black/10' : 'bg-muted'}`}>
          {request.listing.imageUrl ? (
            <img src={request.listing.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">—</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`line-clamp-2 text-xs font-semibold leading-snug ${mine ? 'text-white' : 'text-foreground'}`}>
            {request.listing.title}
          </p>
          <p className={`mt-0.5 text-sm font-bold ${mine ? 'text-white' : 'text-foreground'}`}>
            ${request.listing.priceUsd.toLocaleString('en-US')}
          </p>
          {request.review ? (
            <p className={`mt-0.5 text-[11px] ${mine ? 'text-white/80' : 'text-muted-foreground'}`}>
              {stars(request.review.rating)} ({request.review.rating}/5)
            </p>
          ) : null}
        </div>
      </div>
      <p className={`text-[10px] font-medium ${mine ? 'text-white/70' : 'text-primary'}`}>Tap to review →</p>
    </button>
  );
}

