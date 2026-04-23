'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DmListingSnapshotCard } from '@/components/dm/DmListingSnapshotCard';
import { Button } from '@/components/ui/button';
import { useDmThreadStream, type DmStreamMessage } from '@/hooks/useDmThreadStream';
import type { DmListingSnapshot } from '@/db/queries/dm-threads';

type Props = {
  threadId: string;
  currentUserId: string;
  initialCompose?: boolean;
  listingPreview: DmListingSnapshot | null;
};

type Row = DmStreamMessage;

export function DmThreadView({ threadId, currentUserId, initialCompose = false, listingPreview }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [rows, setRows] = useState<Row[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showListingAttachment, setShowListingAttachment] = useState(Boolean(initialCompose && listingPreview));
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    setShowListingAttachment(Boolean(initialCompose && listingPreview));
  }, [threadId, initialCompose, listingPreview]);

  const clearComposeQuery = useCallback(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    if (u.searchParams.get('compose') === '1') {
      router.replace(pathname);
    }
  }, [pathname, router]);

  const dismissListingAttachment = useCallback(() => {
    setShowListingAttachment(false);
    clearComposeQuery();
  }, [clearComposeQuery]);

  const appendRows = useCallback((incoming: Row[]) => {
    setRows((prev) => {
      const next = [...prev];
      for (const m of incoming) {
        if (seenIds.current.has(m.id)) continue;
        seenIds.current.add(m.id);
        next.push(m);
      }
      next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return next;
    });
  }, []);

  useEffect(() => {
    seenIds.current = new Set();
    setRows([]);
    setLoadError(null);

    (async () => {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, { credentials: 'include' });
      if (!res.ok) {
        setLoadError(res.status === 403 ? 'You do not have access to this thread.' : 'Could not load thread.');
        return;
      }
      const data = (await res.json()) as { messages: Row[] };
      for (const m of data.messages) seenIds.current.add(m.id);
      setRows(data.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    })();
  }, [threadId]);

  useDmThreadStream(threadId, (msg) => {
    appendRows([msg]);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows.length]);

  const canSend = draft.trim().length > 0 || showListingAttachment;

  const onSend = async () => {
    if (!canSend || sending) return;
    setSendError(null);
    setSending(true);
    try {
      const payload: Record<string, unknown> = { body: draft, attachListing: showListingAttachment };
      if (showListingAttachment && listingPreview) {
        payload.listingId = listingPreview.listingId;
      }
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSendError('Message failed to send.');
        return;
      }
      const data = (await res.json()) as { message: Row };
      appendRows([data.message]);
      setDraft('');
      setShowListingAttachment(false);
      clearComposeQuery();
    } finally {
      setSending(false);
    }
  };

  const formatBubbleTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/messages">Back to inbox</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
        {rows.length === 0 ? (
          <p className="text-center text-xs text-neutral-500">No messages yet. Say hello below.</p>
        ) : (
          rows.map((m) => {
            const mine = m.senderId === currentUserId;
            const hasCard = m.listingSnapshot != null;
            const hasText = m.body.trim().length > 0;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-primary text-primary-foreground' : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  {hasCard && m.listingSnapshot ? (
                    <div className={hasText ? 'mb-2' : ''}>
                      <DmListingSnapshotCard snapshot={m.listingSnapshot} variant="inline" />
                    </div>
                  ) : null}
                  {hasText ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
                  <p className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/80' : 'text-neutral-400'}`}>
                    {formatBubbleTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError ? <p className="text-xs text-red-600">{sendError}</p> : null}

      <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 pt-3">
        {showListingAttachment && listingPreview ? (
          <DmListingSnapshotCard variant="composer" snapshot={listingPreview} onRemove={dismissListingAttachment} />
        ) : null}
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message…"
            rows={2}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
          />
          <Button type="button" className="self-end" disabled={sending || !canSend} onClick={() => void onSend()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
