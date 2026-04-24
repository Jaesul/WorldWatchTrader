'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { DmTxRequestSnapshotPayload } from '@/hooks/useDmThreadStream';

type ListItem = DmTxRequestSnapshotPayload & {
  counterpart: {
    id: string;
    username: string;
    handle: string | null;
    walletAddress: string;
    profilePictureUrl: string | null;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRequest: (request: DmTxRequestSnapshotPayload) => void;
  /** Bump to force a reload (e.g. after accept/decline in another component). */
  refreshKey?: number;
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

function avatarUrl(c: ListItem['counterpart']): string {
  return c.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(c.id)}`;
}

function displayName(c: ListItem['counterpart']): string {
  if (c.username?.trim()) return c.username.trim();
  if (c.handle?.trim()) return c.handle.trim();
  const w = c.walletAddress;
  return w.length > 14 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function Row({
  item,
  onClick,
}: {
  item: ListItem;
  onClick: () => void;
}) {
  const chip = statusChip(item.status);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <img
        src={avatarUrl(item.counterpart)}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {displayName(item.counterpart)}
          </p>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${chip.cls}`}
          >
            {chip.label}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {item.listing.title}
        </p>
        <p className="mt-0.5 text-sm font-bold text-foreground">
          ${item.priceUsd.toLocaleString('en-US')}
        </p>
      </div>
    </button>
  );
}

export function TxRequestsListDrawer({
  open,
  onOpenChange,
  onSelectRequest,
  refreshKey = 0,
}: Props) {
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/design/dm/transaction-requests', {
      credentials: 'include',
    });
    if (!res.ok) {
      setError('Could not load requests.');
      setItems([]);
      return;
    }
    const data = (await res.json()) as { requests: ListItem[] };
    setItems(data.requests);
  }, []);

  useEffect(() => {
    if (!open) return;
    setItems(null);
    void load();
  }, [open, refreshKey, load]);

  const pending = (items ?? []).filter((i) => i.status === 'pending');
  const resolved = (items ?? []).filter((i) => i.status !== 'pending');

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full w-full flex-col overflow-hidden px-0 py-0 sm:max-w-sm">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle>Transaction requests</DrawerTitle>
          <p className="text-xs text-muted-foreground">
            Incoming requests from sellers you&apos;ve chatted with.
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {items === null ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Loading…
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-primary underline"
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No requests yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                When a seller sends you a transaction request, it will show up
                here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {pending.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Pending
                  </h3>
                  <div className="flex flex-col gap-2">
                    {pending.map((item) => (
                      <Row
                        key={item.requestId}
                        item={item}
                        onClick={() => {
                          onOpenChange(false);
                          onSelectRequest(item);
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {resolved.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Resolved
                  </h3>
                  <div className="flex flex-col gap-2">
                    {resolved.map((item) => (
                      <Row
                        key={item.requestId}
                        item={item}
                        onClick={() => {
                          onOpenChange(false);
                          onSelectRequest(item);
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
