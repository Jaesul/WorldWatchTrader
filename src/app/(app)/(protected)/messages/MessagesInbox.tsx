'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type InboxThread = {
  id: string;
  lastMessageAt: string;
  listing: { id: string; title: string; priceUsd: number } | null;
  counterpart: {
    id: string;
    username: string;
    handle: string | null;
    profilePictureUrl: string | null;
    walletAddress: string;
  };
  lastMessagePreview: string | null;
};

function avatarUrl(u: InboxThread['counterpart']): string {
  return u.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(u.id)}`;
}

function displayName(u: InboxThread['counterpart']): string {
  if (u.username?.trim()) return u.username.trim();
  if (u.handle?.trim()) return u.handle.trim();
  const w = u.walletAddress;
  return w.length > 14 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
}

export function MessagesInbox() {
  const [threads, setThreads] = useState<InboxThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/messages/threads', { credentials: 'include' });
    if (!res.ok) {
      setError(res.status === 401 ? 'Sign in to view messages.' : 'Could not load messages.');
      setThreads([]);
      return;
    }
    const data = (await res.json()) as { threads: InboxThread[] };
    setThreads(data.threads);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (threads === null) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="text-sm font-medium text-neutral-800">No conversations yet</p>
        <p className="mt-2 text-xs text-neutral-500">
          When you message a seller from a listing, it shows up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-200">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`/messages/${t.id}`}
            className="flex items-start gap-3 py-3.5 transition-colors hover:bg-neutral-50"
          >
            <img
              src={avatarUrl(t.counterpart)}
              alt=""
              className="size-11 shrink-0 rounded-full bg-neutral-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">{displayName(t.counterpart)}</p>
                <time className="shrink-0 text-[10px] text-neutral-400" dateTime={t.lastMessageAt}>
                  {formatTime(t.lastMessageAt)}
                </time>
              </div>
              {t.listing ? (
                <p className="truncate text-xs text-neutral-500">{t.listing.title}</p>
              ) : null}
              <p className={`truncate text-xs text-neutral-600 ${t.listing ? 'mt-0.5' : ''}`}>
                {t.lastMessagePreview?.trim() ?? 'No messages yet'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
