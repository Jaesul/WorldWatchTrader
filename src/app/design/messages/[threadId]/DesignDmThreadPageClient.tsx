'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Forward, MoreVertical } from 'lucide-react';

import { DesignDmThreadSkeleton } from '@/app/design/messages/DesignDmThreadSkeleton';
import { WorldOrbIcon } from '@/components/icons/world-orb';
import { DmListingSnapshotCard } from '@/components/dm/DmListingSnapshotCard';
import { DmShipmentCard } from '@/components/dm/DmShipmentCard';
import { DmThreadMenuDrawer } from '@/components/dm/DmThreadMenuDrawer';
import { DmTxRequestCard } from '@/components/dm/DmTxRequestCard';
import { SendShippingSheet } from '@/components/dm/SendShippingSheet';
import { SendTransactionSheet } from '@/components/dm/SendTransactionSheet';
import { TxRequestDetailsDrawer } from '@/components/dm/TxRequestDetailsDrawer';
import { TxRequestsListDrawer } from '@/components/dm/TxRequestsListDrawer';
import { Button } from '@/components/ui/button';
import {
  useDmThreadStream,
  type DmStreamMessage,
  type DmTxRequestSnapshotPayload,
} from '@/hooks/useDmThreadStream';
import type { DmListingSnapshot } from '@/db/queries/dm-threads';
import { useDesignViewer } from '@/lib/design/DesignViewerProvider';
import { sellerPublicProfileSlug } from '@/lib/design/map-db-feed-to-listing';

type ThreadMeta = {
  thread: { id: string; buyerId: string; sellerId: string; listingId: string | null; lastMessageAt: string };
  listing: {
    id: string;
    title: string;
    priceUsd: number;
    status: string;
    imageUrl?: string | null;
  } | null;
  counterpart: {
    id: string;
    username: string;
    handle: string | null;
    profilePictureUrl: string | null;
    walletAddress: string;
    orbVerified: boolean;
  };
};

function avatarUrl(c: ThreadMeta['counterpart']): string {
  return c.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(c.id)}`;
}

function displayName(c: ThreadMeta['counterpart']): string {
  if (c.username?.trim()) return c.username.trim();
  if (c.handle?.trim()) return c.handle.trim();
  const w = c.walletAddress;
  return w.length > 14 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

export type DesignDmThreadPageClientProps = {
  threadId: string;
  initialCompose: boolean;
  /** Listing UUID for compose preview when the thread row has no `listing_id` (person-to-person threads). */
  initialListingContextId: string | null;
};

export function DesignDmThreadPageClient({
  threadId,
  initialCompose,
  initialListingContextId,
}: DesignDmThreadPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;

  const [meta, setMeta] = useState<ThreadMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [rows, setRows] = useState<DmStreamMessage[]>([]);
  const [loadMsgError, setLoadMsgError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showListingAttachment, setShowListingAttachment] = useState(initialCompose);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sendTxOpen, setSendTxOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [txListOpen, setTxListOpen] = useState(false);
  const [txDetailsRequest, setTxDetailsRequest] =
    useState<DmTxRequestSnapshotPayload | null>(null);
  const [summary, setSummary] = useState<{
    totalPending: number;
    pendingByThread: Record<string, number>;
  }>({ totalPending: 0, pendingByThread: {} });
  const [txListRefreshKey, setTxListRefreshKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      setShowListingAttachment(true);
    }
  }, [searchParams]);

  const clearComposeQuery = useCallback(() => {
    if (searchParams.get('compose') === '1' || searchParams.get('listingContext')) {
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  const dismissListingAttachment = useCallback(() => {
    setShowListingAttachment(false);
    clearComposeQuery();
  }, [clearComposeQuery]);

  const append = useCallback((incoming: DmStreamMessage[]) => {
    setRows((prev) => {
      const next = [...prev];
      for (const m of incoming) {
        if (seenIds.current.has(m.id)) continue;
        seenIds.current.add(m.id);
        next.push(m);
      }
      next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Propagate latest tx-request snapshots to any earlier rows sharing the
      // same request id. The server always returns the current status on every
      // message fetch, so the most recent message in `next` wins.
      const latestByReqId = new Map<string, DmTxRequestSnapshotPayload>();
      for (const row of next) {
        const snap = row.txRequest;
        if (snap && (!latestByReqId.has(snap.requestId)
          || new Date(snap.updatedAt).getTime() >
            new Date(latestByReqId.get(snap.requestId)!.updatedAt).getTime())
        ) {
          latestByReqId.set(snap.requestId, snap);
        }
      }
      if (latestByReqId.size === 0) return next;
      return next.map((row) => {
        if (!row.txRequest) return row;
        const latest = latestByReqId.get(row.txRequest.requestId);
        return latest && latest !== row.txRequest ? { ...row, txRequest: latest } : row;
      });
    });
  }, []);

  const applyTxUpdate = useCallback((updated: DmTxRequestSnapshotPayload) => {
    setRows((prev) =>
      prev.map((row) =>
        row.txRequest && row.txRequest.requestId === updated.requestId
          ? { ...row, txRequest: updated }
          : row,
      ),
    );
  }, []);

  const loadSummary = useCallback(async () => {
    if (!viewerId) return;
    try {
      const res = await fetch('/api/design/dm/transaction-requests/summary', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        totalPending: number;
        pendingByThread: Record<string, number>;
      };
      setSummary(data);
    } catch {
      /* swallow */
    }
  }, [viewerId]);

  useEffect(() => {
    if (!viewerId || !threadId) return;
    seenIds.current = new Set();
    setRows([]);
    setMeta(null);
    setMetaError(null);
    setLoadMsgError(null);

    (async () => {
      const listingCtx =
        initialListingContextId?.trim() || searchParams.get('listingContext')?.trim() || '';
      const metaQuery = listingCtx ? `?listingContext=${encodeURIComponent(listingCtx)}` : '';
      const [metaRes, msgRes] = await Promise.all([
        fetch(`/api/design/dm/threads/${threadId}${metaQuery}`, { credentials: 'include' }),
        fetch(`/api/design/dm/threads/${threadId}/messages`, { credentials: 'include' }),
      ]);

      if (!metaRes.ok) {
        setMetaError(metaRes.status === 404 ? 'Thread not found.' : 'Could not load thread.');
        return;
      }
      const metaJson = (await metaRes.json()) as ThreadMeta;
      setMeta(metaJson);

      if (!msgRes.ok) {
        setLoadMsgError('Could not load messages.');
        return;
      }
      const msgJson = (await msgRes.json()) as { messages: DmStreamMessage[] };
      for (const m of msgJson.messages) seenIds.current.add(m.id);
      setRows(
        msgJson.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    })();
  }, [threadId, viewerId, initialListingContextId, searchParams]);

  useDmThreadStream(
    viewerId && threadId ? threadId : null,
    (msg) => append([msg]),
    { streamUrl: (id) => `/api/design/dm/threads/${id}/stream` },
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows.length]);

  useEffect(() => {
    if (!viewerId) return;
    void loadSummary();
    const iv = window.setInterval(() => void loadSummary(), 15000);
    return () => window.clearInterval(iv);
  }, [viewerId, loadSummary]);

  const composerSnapshot: DmListingSnapshot | null =
    meta?.listing != null
      ? {
          listingId: meta.listing.id,
          title: meta.listing.title,
          priceUsd: meta.listing.priceUsd,
          status: meta.listing.status,
          imageUrl: meta.listing.imageUrl ?? null,
        }
      : null;

  const onSend = async () => {
    const text = draft.trim();
    if ((!text && !showListingAttachment) || !threadId || !viewerId || sending) return;
    setSendError(null);
    setSending(true);
    try {
      const payload: Record<string, unknown> = { body: draft, attachListing: showListingAttachment };
      if (showListingAttachment && composerSnapshot) {
        payload.listingId = composerSnapshot.listingId;
      }
      const res = await fetch(`/api/design/dm/threads/${threadId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSendError('Send failed.');
        return;
      }
      const data = (await res.json()) as { message: DmStreamMessage };
      append([data.message]);
      setDraft('');
      setShowListingAttachment(false);
      clearComposeQuery();
    } finally {
      setSending(false);
    }
  };

  const formatBubbleTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

  if (!viewerId) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        Pick a design profile user to open DMs.
      </div>
    );
  }

  if (metaError) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-red-600">{metaError}</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/design/messages">Back to inbox</Link>
        </Button>
      </div>
    );
  }

  if (!meta) {
    return <DesignDmThreadSkeleton />;
  }

  const c = meta.counterpart;
  const profileSlug = sellerPublicProfileSlug(c);
  const canSend = draft.trim().length > 0 || showListingAttachment;
  const dockBottomPad = showListingAttachment ? 'pb-4' : 'pb-3';
  const threadHasPending = (summary.pendingByThread[threadId] ?? 0) > 0;
  const hasGlobalPending = summary.totalPending > 0;

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-3 sm:px-4">
        <Link href="/design/messages" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground" aria-label="Back to inbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <Link href={`/design/u/${profileSlug}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative shrink-0">
            <img src={avatarUrl(c)} alt="" className="size-9 rounded-full object-cover bg-foreground" />
            {c.orbVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-world-verified ring-1 ring-background">
                <WorldOrbIcon className="size-2 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none text-foreground">{displayName(c)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">View profile →</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Thread actions"
        >
          <MoreVertical className="size-5" />
          {threadHasPending ? (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background"
            />
          ) : null}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-3">
        {loadMsgError ? <p className="text-center text-xs text-red-600">{loadMsgError}</p> : null}
        {rows.length === 0 && !loadMsgError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">Say hello below — updates stream live from the database.</p>
          </div>
        ) : (
          rows.map((m) => {
            const mine = m.senderId === viewerId;
            const hasShipment = m.shipment != null;
            const hasTxRequest = !hasShipment && m.txRequest != null;
            const hasCard = !hasTxRequest && !hasShipment && m.listingSnapshot != null;
            const hasText = m.body.trim().length > 0;
            if (hasShipment && m.shipment) {
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl p-1 ${
                      mine ? 'rounded-br-sm bg-[#ffc85c]' : 'rounded-bl-sm bg-muted'
                    }`}
                  >
                    <DmShipmentCard shipment={m.shipment} mine={mine} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBubbleTime(m.createdAt)}
                  </span>
                </div>
              );
            }
            if (hasTxRequest && m.txRequest) {
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl p-1 ${
                      mine ? 'rounded-br-sm bg-[#ffc85c]' : 'rounded-bl-sm bg-muted'
                    }`}
                  >
                    <DmTxRequestCard
                      request={m.txRequest}
                      mine={mine}
                      onOpen={() => setTxDetailsRequest(m.txRequest ?? null)}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBubbleTime(m.createdAt)}
                  </span>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine ? 'rounded-br-sm bg-[#ffc85c] text-white' : 'rounded-bl-sm bg-muted text-foreground'
                  }`}
                >
                  {hasCard && m.listingSnapshot ? (
                    <div className={hasText ? 'mb-2' : ''}>
                      <DmListingSnapshotCard snapshot={m.listingSnapshot} variant="inline" />
                    </div>
                  ) : null}
                  {hasText ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatBubbleTime(m.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className={`sticky bottom-0 z-20 border-t border-border bg-background px-4 pt-2 ${dockBottomPad}`}>
        <div className="mx-auto max-w-lg">
          {sendError ? <p className="mb-1 text-xs text-red-600">{sendError}</p> : null}
          {showListingAttachment && composerSnapshot ? (
            <div className="mb-2">
              <DmListingSnapshotCard
                variant="composer"
                snapshot={composerSnapshot}
                onRemove={dismissListingAttachment}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder={`Message ${displayName(c).split(' ')[0] ?? 'seller'}…`}
              className="min-h-10 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2 text-sm leading-snug outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              disabled={sending || !canSend}
              onClick={() => void onSend()}
              aria-label="Send"
            >
              <Forward className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <DmThreadMenuDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onSelectSend={() => setSendTxOpen(true)}
        onSelectShipping={() => setShippingOpen(true)}
        onSelectList={() => setTxListOpen(true)}
        hasGlobalPending={hasGlobalPending}
      />

      <SendTransactionSheet
        open={sendTxOpen}
        onOpenChange={setSendTxOpen}
        threadId={threadId}
        onSent={() => {
          void loadSummary();
        }}
      />

      <SendShippingSheet
        open={shippingOpen}
        onOpenChange={setShippingOpen}
        threadId={threadId}
        onSent={(msg) => append([msg])}
      />

      <TxRequestsListDrawer
        open={txListOpen}
        onOpenChange={setTxListOpen}
        onSelectRequest={(req) => setTxDetailsRequest(req)}
        refreshKey={txListRefreshKey}
      />

      <TxRequestDetailsDrawer
        open={txDetailsRequest != null}
        onOpenChange={(next) => {
          if (!next) setTxDetailsRequest(null);
        }}
        request={txDetailsRequest}
        viewerId={viewerId}
        onResolved={(updated) => {
          applyTxUpdate(updated);
          setTxListRefreshKey((k) => k + 1);
          void loadSummary();
        }}
      />
    </div>
  );
}

