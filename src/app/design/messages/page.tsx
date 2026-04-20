'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMessages, getLastMessage, classifyThread } from '@/lib/design/thread-store';
import { getListingAttachmentThumbnail } from '@/lib/design/listing-attachment-thumb';
import { useMyListings } from '@/lib/design/use-my-listings';

type FilterMode = 'all' | 'inbound' | 'outbound';

interface KnownThread {
  id: string;
  /** Unix-ms timestamp of the last message — used for reverse-chron sort. */
  lastActiveMs: number;
  seller: { name: string; handle: string; verified: boolean; avatar: string };
}

// lastActiveMs reflects the sentAt time of the final seed message for each thread.
// Higher = more recent → sorted descending so the freshest thread appears first.
const KNOWN_THREADS: KnownThread[] = [
  { id: 'seller-harbortime', lastActiveMs: Date.now() - 1 * 60 * 1000,   seller: { name: 'Harbor Time Co.', handle: 'harbortime', verified: true,  avatar: 'https://i.pravatar.cc/150?u=harbortime' } },
  { id: 'seller-marcor',     lastActiveMs: Date.now() - 45 * 60 * 1000,  seller: { name: 'Marco R.',        handle: 'marcor',     verified: false, avatar: 'https://i.pravatar.cc/150?u=marcor'     } },
  { id: 'seller-alexkim',    lastActiveMs: Date.now() - 120 * 60 * 1000, seller: { name: 'Alex Kim',        handle: 'alexkim',    verified: true,  avatar: 'https://i.pravatar.cc/150?u=alexkim'    } },
];

function ThreadRow({ thread }: { thread: KnownThread }) {
  const myListings = useMyListings();
  const [lastMsg, setLastMsg] = useState(getLastMessage(thread.id));
  const [msgCount, setMsgCount] = useState(getMessages(thread.id).length);

  // Re-read store on focus so the list updates after returning from a chat
  useEffect(() => {
    function refresh() {
      setLastMsg(getLastMessage(thread.id));
      setMsgCount(getMessages(thread.id).length);
    }
    window.addEventListener('focus', refresh);
    // also poll lightly while visible
    const t = setInterval(refresh, 800);
    return () => { window.removeEventListener('focus', refresh); clearInterval(t); };
  }, [thread.id]);

  const isEmpty = msgCount === 0;
  const listingThumb = lastMsg?.listing
    ? getListingAttachmentThumbnail(lastMsg.listing, myListings)
    : null;

  return (
    <Link href={`/design/messages/${thread.id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30">
      <div className="relative shrink-0">
        <img
          src={thread.seller.avatar}
          alt={thread.seller.name}
          className="size-11 rounded-full object-cover bg-foreground"
        />
        {thread.seller.verified && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-world-verified ring-2 ring-background">
            <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{thread.seller.name}</p>
        {lastMsg?.listing && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {listingThumb ? (
              <img src={listingThumb} alt="" className="size-4 shrink-0 rounded object-cover ring-1 ring-border" />
            ) : (
              <span className="shrink-0 text-sm">⌚</span>
            )}
            <span className="truncate text-[11px] text-muted-foreground">{lastMsg.listing.model}</span>
          </div>
        )}
        <p className={`mt-0.5 truncate text-xs ${isEmpty ? 'italic text-muted-foreground/60' : 'text-muted-foreground'}`}>
          {isEmpty
            ? 'No messages yet'
            : lastMsg?.text
              ? lastMsg.text
              : lastMsg?.images?.length
                ? lastMsg.images.length === 1
                  ? 'Photo'
                  : `${lastMsg.images.length} photos`
                : lastMsg?.listing
                  ? `Replied to: ${lastMsg.listing.model}`
                  : ''}
        </p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-1 size-4 shrink-0 text-muted-foreground/50">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

const FILTER_LABELS: { id: FilterMode; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'inbound',  label: 'Inbound'  },
  { id: 'outbound', label: 'Outbound' },
];

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  // Sorted newest-first, then optionally filtered by direction.
  const sortedThreads = [...KNOWN_THREADS].sort((a, b) => b.lastActiveMs - a.lastActiveMs);

  const visibleThreads = sortedThreads.filter((t) => {
    if (filter !== 'all') {
      const { inbound, outbound } = classifyThread(t.id);
      if (filter === 'inbound'  && !inbound)  return false;
      if (filter === 'outbound' && !outbound) return false;
    }
    if (search.trim() !== '') {
      return t.seller.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  // Separate set used only for the search dropdown (not filtered by direction).
  const searchMatches = sortedThreads.filter((t) =>
    search.trim() === '' || t.seller.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 pb-3 pt-5">
        <h1 className="mb-3 text-xl font-semibold text-foreground">Messages</h1>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search conversations…"
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
              {search.trim() === '' ? 'Recent conversations' : 'Results'}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {searchMatches.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/design/messages/${t.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 border-b border-border last:border-0"
                >
                  <img
                    src={t.seller.avatar}
                    alt={t.seller.name}
                    className="size-8 shrink-0 rounded-full object-cover bg-foreground"
                  />
                  <span className="text-sm font-medium text-foreground">{t.seller.name}</span>
                  {t.seller.verified && (
                    <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-world-verified">
                      <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter pills — always visible when not in search-dropdown mode */}
      {!focused && (
        <div className="flex gap-2 px-4 pt-3 pb-2">
          {FILTER_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                filter === id
                  ? 'bg-foreground text-background'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!focused && (
        <>
          {visibleThreads.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                {search.trim() !== '' ? 'No conversations found' : `No ${filter} conversations`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search.trim() !== '' ? 'Try a different name.' : filter === 'inbound' ? 'Conversations where someone has inquired about your listings will appear here.' : 'Conversations where you have replied to a listing will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visibleThreads.map((thread) => (
                <li key={thread.id}>
                  <ThreadRow thread={thread} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
