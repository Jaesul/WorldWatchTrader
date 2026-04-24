'use client';

import type { DmListingSnapshot } from '@/db/queries/dm-threads';

type Props = {
  snapshot: DmListingSnapshot;
  variant?: 'inline' | 'composer';
  onRemove?: () => void;
};

export function DmListingSnapshotCard({ snapshot, variant = 'inline', onRemove }: Props) {
  const isComposer = variant === 'composer';
  return (
    <div
      className={
        isComposer
          ? 'relative flex gap-2.5 overflow-hidden rounded-xl border border-border bg-muted/50 p-2 pr-8 text-left'
          : 'flex max-w-full gap-2 overflow-hidden rounded-lg border border-white/25 bg-black/10 p-1.5 text-left'
      }
    >
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Remove listing preview"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      ) : null}
      <div
        className={
          isComposer
            ? 'relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted'
            : 'relative size-12 shrink-0 overflow-hidden rounded-md bg-muted'
        }
      >
        {snapshot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[9px] text-muted-foreground">—</div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">{snapshot.title}</p>
        <p className="mt-0.5 text-[10px] font-medium text-foreground">
          ${snapshot.priceUsd.toLocaleString('en-US')}
        </p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{snapshot.status}</p>
      </div>
    </div>
  );
}
