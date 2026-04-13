'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMessages, getLastMessage } from '@/lib/design/thread-store';

interface KnownThread {
  id: string;
  seller: { name: string; handle: string; verified: boolean };
}

const KNOWN_THREADS: KnownThread[] = [
  { id: 'seller-alexkim', seller: { name: 'Alex Kim', handle: 'alexkim', verified: true } },
  { id: 'seller-harbortime', seller: { name: 'Harbor Time Co.', handle: 'harbortime', verified: true } },
  { id: 'seller-marcor', seller: { name: 'Marco R.', handle: 'marcor', verified: false } },
  { id: 'seller-cristianv', seller: { name: 'Cristian V.', handle: 'cristianv', verified: true } },
  { id: 'seller-julesw', seller: { name: 'Jules W.', handle: 'julesw', verified: false } },
  { id: 'seller-dmitril', seller: { name: 'Dmitri L.', handle: 'dmitril', verified: true } },
  { id: 'seller-yukit', seller: { name: 'Yuki T.', handle: 'yukit', verified: true } },
];

function Initials({ name }: { name: string }) {
  const p = name.split(' ');
  return <>{(p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()}</>;
}

function ThreadRow({ thread }: { thread: KnownThread }) {
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

  return (
    <Link href={`/design/messages/${thread.id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30">
      <div className="relative shrink-0">
        <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          <Initials name={thread.seller.name} />
        </div>
        {thread.seller.verified && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500 ring-2 ring-background">
            <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{thread.seller.name}</p>
        {lastMsg?.listing && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-sm">⌚</span>
            <span className="truncate text-[11px] text-muted-foreground">{lastMsg.listing.model}</span>
          </div>
        )}
        <p className={`mt-0.5 truncate text-xs ${isEmpty ? 'italic text-muted-foreground/60' : 'text-muted-foreground'}`}>
          {isEmpty
            ? 'No messages yet'
            : lastMsg?.text
              ? lastMsg.text
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

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = KNOWN_THREADS.filter((t) =>
    search.trim() === '' || t.seller.name.toLowerCase().includes(search.toLowerCase())
  );

  const showRecent = !focused && search.trim() === '';

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

        {(focused || search.trim() !== '') && filtered.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {search.trim() === '' ? 'Recent conversations' : 'Results'}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {filtered.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/design/messages/${t.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30 border-b border-border last:border-0"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    <Initials name={t.seller.name} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{t.seller.name}</span>
                  {t.seller.verified && (
                    <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-500">
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

      {!focused && search.trim() === '' && (
        <>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">All conversations</p>
          </div>
          <ul className="divide-y divide-border">
            {KNOWN_THREADS.map((thread) => (
              <li key={thread.id}>
                <ThreadRow thread={thread} />
              </li>
            ))}
          </ul>
        </>
      )}

      {!focused && search.trim() !== '' && (
        <>
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No conversations found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different name.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((thread) => (
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
