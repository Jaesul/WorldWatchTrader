'use client';

import { formatUnits } from 'viem';

import type { DmTxRequestSnapshotPayload } from '@/hooks/useDmThreadStream';

type Props = {
  request: DmTxRequestSnapshotPayload;
  mine: boolean;
  onOpen: () => void;
};

function statusChip(status: DmTxRequestSnapshotPayload['status']) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        cls: 'bg-amber-500/15 text-amber-700 border border-amber-500/30',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        cls: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
      };
    case 'declined':
      return {
        label: 'Declined',
        cls: 'bg-rose-500/15 text-rose-700 border border-rose-500/30',
      };
  }
}

function wldHumanLabel(raw: string | null | undefined): string | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  try {
    return `${formatUnits(BigInt(raw), 18)} WLD`;
  } catch {
    return null;
  }
}

export function DmTxRequestCard({ request, mine, onOpen }: Props) {
  const chip = statusChip(request.status);
  const lockedWld = wldHumanLabel(request.settlementAmountWldRaw ?? null);
  const firstLine = request.description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full max-w-[280px] flex-col gap-2 rounded-2xl border p-2.5 text-left transition-colors ${
        mine
          ? 'border-white/25 bg-black/10 text-white hover:bg-black/15'
          : 'border-border bg-background text-foreground hover:bg-muted/40'
      }`}
      aria-label="Open transaction request"
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            mine ? 'text-white/80' : 'text-muted-foreground'
          }`}
        >
          Transaction request
        </p>
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${chip.cls}`}>
          {chip.label}
        </span>
      </div>
      <div className="flex gap-2.5">
        <div className={`relative size-14 shrink-0 overflow-hidden rounded-lg ${mine ? 'bg-black/10' : 'bg-muted'}`}>
          {request.listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={request.listing.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`line-clamp-2 text-xs font-semibold leading-snug ${
              mine ? 'text-white' : 'text-foreground'
            }`}
          >
            {request.listing.title}
          </p>
          <p
            className={`mt-0.5 text-sm font-bold ${
              mine ? 'text-white' : 'text-foreground'
            }`}
          >
            ${request.priceUsd.toLocaleString('en-US')}
          </p>
          {lockedWld ? (
            <p
              className={`mt-0.5 text-[11px] font-medium ${
                mine ? 'text-white/85' : 'text-foreground/85'
              }`}
            >
              {lockedWld}
            </p>
          ) : null}
          {firstLine ? (
            <p
              className={`mt-0.5 line-clamp-1 text-[11px] ${
                mine ? 'text-white/80' : 'text-muted-foreground'
              }`}
            >
              {firstLine}
            </p>
          ) : null}
        </div>
      </div>
      <p
        className={`text-[10px] font-medium ${
          mine ? 'text-white/70' : 'text-primary'
        }`}
      >
        Tap to review →
      </p>
    </button>
  );
}
