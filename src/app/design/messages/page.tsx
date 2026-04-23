'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DesignDmInboxSkeleton } from '@/app/design/messages/DesignDmInboxSkeleton';
import { WorldOrbIcon } from '@/components/icons/world-orb';
import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

type ApiThread = {
  id: string;
  lastMessageAt: string;
  buyerId: string;
  sellerId: string;
  listing: { id: string; title: string; priceUsd: number; status: string } | null;
  lastMessageSenderId: string | null;
  counterpart: {
    id: string;
    username: string;
    handle: string | null;
    profilePictureUrl: string | null;
    walletAddress: string;
    orbVerified: boolean;
  };
  lastMessagePreview: string | null;
};

function avatarUrl(c: ApiThread['counterpart']): string {
  return c.profilePictureUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(c.id)}`;
}

function displayName(c: ApiThread['counterpart']): string {
  if (c.username?.trim()) return c.username.trim();
  if (c.handle?.trim()) return c.handle.trim();
  const w = c.walletAddress;
  return w.length > 14 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function formatPriceUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function ThreadRow({ thread }: { thread: ApiThread }) {
  const c = thread.counterpart;
  return (
    <Link
      href={`/design/messages/${thread.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30"
    >
      <div className="relative shrink-0">
        <img
          src={avatarUrl(c)}
          alt=""
          className="size-11 rounded-full object-cover bg-foreground"
        />
        {c.orbVerified && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-world-verified ring-2 ring-background">
            <WorldOrbIcon className="size-2.5 text-white" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{displayName(c)}</p>
        {thread.listing ? (
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-sm">⌚</span>
            <span className="truncate text-[11px] text-muted-foreground">{thread.listing.title}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground/80">{formatPriceUsd(thread.listing.priceUsd)}</span>
          </div>
        ) : null}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {thread.lastMessagePreview?.trim() ? thread.lastMessagePreview : 'No messages yet'}
        </p>
      </div>
      <div className="mt-0.5 flex shrink-0 flex-col items-end gap-0.5">
        <time className="text-[10px] text-muted-foreground/80" dateTime={thread.lastMessageAt}>
          {formatTime(thread.lastMessageAt)}
        </time>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="size-4 text-muted-foreground/50"
          aria-hidden
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

export default function DesignMessagesPage() {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;

  const [threads, setThreads] = useState<ApiThread[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const load = useCallback(async () => {
    if (!viewerId) {
      setThreads([]);
      setLoadError(null);
      return;
    }
    setLoadError(null);
    const res = await fetch('/api/design/dm/threads', { credentials: 'include' });
    if (!res.ok) {
      setLoadError('Could not load conversations.');
      setThreads([]);
      return;
    }
    const data = (await res.json()) as { threads: ApiThread[] };
    setThreads(data.threads);
  }, [viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onFocus() {
      void load();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const sortedThreads = useMemo(() => {
    if (!threads) return [];
    return [...threads].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [threads]);

  const visibleThreads = useMemo(() => {
    return sortedThreads.filter((t) => {
      if (!viewerId) return false;
      if (search.trim() === '') return true;
      const q = search.toLowerCase();
      return (
        displayName(t.counterpart).toLowerCase().includes(q) ||
        (t.counterpart.handle?.toLowerCase().includes(q) ?? false) ||
        (t.listing?.title.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sortedThreads, search, viewerId]);

  const searchMatches = useMemo(() => {
    if (search.trim() === '') return sortedThreads.slice(0, 5);
    const q = search.toLowerCase();
    return sortedThreads.filter(
      (t) =>
        displayName(t.counterpart).toLowerCase().includes(q) ||
        (t.counterpart.handle?.toLowerCase().includes(q) ?? false) ||
        (t.listing?.title.toLowerCase().includes(q) ?? false),
    );
  }, [sortedThreads, search]);

  if (!viewerId) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Choose <strong>Profile</strong> in the nav and pick a user — the design viewer is used as &quot;you&quot; for
          real inbox data from the database.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 pb-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-foreground">Messages</h1>
          <button
            type="button"
            onClick={() => {
              void load();
              toast.success('Refreshed');
            }}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or recent listing…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="h-10 w-full rounded-full border border-border bg-muted/40 pl-9 pr-4 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        {(focused || search.trim() !== '') && searchMatches.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {search.trim() === '' ? 'Recent' : 'Results'}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {searchMatches.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/design/messages/${t.id}`}
                  className="flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors hover:bg-muted/30 last:border-0"
                >
                  <img
                    src={avatarUrl(t.counterpart)}
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover bg-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {displayName(t.counterpart)}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t.listing?.title ?? (t.lastMessagePreview?.trim() || 'Open conversation')}
                    </span>
                  </div>
                  {t.counterpart.orbVerified && (
                    <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-world-verified">
                      <WorldOrbIcon className="size-2.5 text-white" />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!focused && (
        <>
          {threads === null ? (
            <DesignDmInboxSkeleton />
          ) : loadError ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button type="button" className="mt-2 text-sm font-medium text-primary underline" onClick={() => void load()}>
                Retry
              </button>
            </div>
          ) : visibleThreads.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                {search.trim() !== '' ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search.trim() !== '' ? 'Try another search.' : 'Reply from a listing to start a thread.'}
              </p>
              <Link href="/design" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
                Back to feed
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visibleThreads.map((t) => (
                <li key={t.id}>
                  <ThreadRow thread={t} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
