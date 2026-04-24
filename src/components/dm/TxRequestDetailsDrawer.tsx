'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import type { DmTxRequestSnapshotPayload } from '@/hooks/useDmThreadStream';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DmTxRequestSnapshotPayload | null;
  viewerId: string | null;
  /** Called after accept or decline with the updated request snapshot. */
  onResolved?: (updated: DmTxRequestSnapshotPayload) => void;
};

function statusBadge(status: DmTxRequestSnapshotPayload['status']) {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-700 border border-amber-500/30';
    case 'accepted':
      return 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30';
    case 'declined':
      return 'bg-rose-500/15 text-rose-700 border border-rose-500/30';
  }
}

export function TxRequestDetailsDrawer({
  open,
  onOpenChange,
  request,
  viewerId,
  onResolved,
}: Props) {
  const [mode, setMode] = useState<'view' | 'decline'>('view');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null);

  useEffect(() => {
    if (!open) {
      setMode('view');
      setReason('');
      setSubmitting(null);
    }
  }, [open]);

  if (!request) return null;

  const viewerIsRecipient =
    !!viewerId && viewerId === request.recipientId;
  const canResolve = viewerIsRecipient && request.status === 'pending';

  async function patchRequest(
    action: 'accept' | 'decline',
    body?: { reason?: string },
  ) {
    if (!request) return;
    setSubmitting(action);
    try {
      const res = await fetch(`/api/design/dm/transaction-requests/${request.requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        request?: DmTxRequestSnapshotPayload;
        error?: string;
      };
      if (!res.ok || !data.request) {
        toast.error(
          typeof data.error === 'string' ? data.error : 'Could not update request',
        );
        return;
      }
      toast.success(action === 'accept' ? 'Transaction accepted' : 'Request declined');
      onResolved?.(data.request);
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-5 pb-6">
        <DrawerHeader className="px-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle>Transaction request</DrawerTitle>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(request.status)}`}
            >
              {request.status === 'pending'
                ? 'Pending'
                : request.status === 'accepted'
                  ? 'Accepted'
                  : 'Declined'}
            </span>
          </div>
          <DrawerDescription className="text-xs">
            Review the listing and price before responding.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {request.listing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.listing.imageUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                —
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">
              {request.listing.title}
            </p>
            <p className="mt-1 text-base font-bold text-foreground">
              ${request.priceUsd.toLocaleString('en-US')}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">
              {request.listing.status}
            </p>
          </div>
        </div>

        {request.description.trim() ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
              {request.description}
            </p>
          </div>
        ) : null}

        {request.status === 'declined' && request.declineReason ? (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
              Decline reason
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-rose-900/90">
              {request.declineReason}
            </p>
          </div>
        ) : null}

        {canResolve && mode === 'view' ? (
          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => void patchRequest('accept')}
              disabled={submitting != null}
              className="w-full"
            >
              {submitting === 'accept' ? 'Accepting…' : 'Accept transaction'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('decline')}
              disabled={submitting != null}
              className="w-full"
            >
              Decline
            </Button>
          </div>
        ) : null}

        {canResolve && mode === 'decline' ? (
          <div className="mt-5 flex flex-col gap-3">
            <div>
              <label
                htmlFor="tx-decline-reason"
                className="text-xs font-medium text-foreground"
              >
                Reason (optional)
              </label>
              <Textarea
                id="tx-decline-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Let them know why you're declining…"
                className="mt-1 text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {reason.length}/500
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setMode('view')}
                disabled={submitting != null}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => void patchRequest('decline', { reason })}
                disabled={submitting != null}
              >
                {submitting === 'decline' ? 'Declining…' : 'Confirm decline'}
              </Button>
            </div>
          </div>
        ) : null}

        {!canResolve && request.status !== 'pending' ? (
          <div className="mt-5 text-center text-xs text-muted-foreground">
            This request is {request.status}.
          </div>
        ) : null}

        {!canResolve && request.status === 'pending' ? (
          <div className="mt-5 text-center text-xs text-muted-foreground">
            Waiting on the buyer to respond.
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
