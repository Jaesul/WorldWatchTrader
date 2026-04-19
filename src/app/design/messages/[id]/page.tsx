'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Forward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getMessages,
  addMessage,
  hasListingRef,
  type ThreadMessage,
} from '@/lib/design/thread-store';
import { getListingById, formatPrice } from '@/lib/design/data';

const SELLER_INFO: Record<string, { name: string; handle: string; verified: boolean; avatar: string }> = {
  'seller-alexkim': { name: 'Alex Kim', handle: 'alexkim', verified: true, avatar: 'https://i.pravatar.cc/150?u=alexkim' },
  'seller-harbortime': { name: 'Harbor Time Co.', handle: 'harbortime', verified: true, avatar: 'https://i.pravatar.cc/150?u=harbortime' },
  'seller-marcor': { name: 'Marco R.', handle: 'marcor', verified: false, avatar: 'https://i.pravatar.cc/150?u=marcor' },
};

function ListingCard({ listing }: { listing: NonNullable<ThreadMessage['listing']> }) {
  return (
    <Link
      href="/design"
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${listing.active ? 'border-border bg-muted/40 hover:bg-muted/70' : 'border-border/40 bg-muted/20 opacity-60'}`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{listing.model}</p>
        <p className="text-[11px] text-muted-foreground">{listing.price} · {listing.active ? 'Active listing' : 'Listing ended'}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="ml-auto size-4 shrink-0 text-muted-foreground/50">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingParam = searchParams.get('listing');
  const threadId = params.id;

  const seller = SELLER_INFO[threadId] ?? { name: 'Seller', handle: threadId.replace('seller-', ''), verified: false };

  // Remember whether the user arrived via a listing reply — determines back destination.
  const arrivedFromListing = useRef(!!listingParam);

  const [messages, setMessages] = useState<ThreadMessage[]>(() => getMessages(threadId));
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Staged listing: the card pinned above the compose bar, waiting to be sent.
  // We only stage it if it hasn't already been sent in this thread.
  type StagedListing = NonNullable<ThreadMessage['listing']>;
  const [staged, setStaged] = useState<StagedListing | null>(() => {
    if (!listingParam) return null;
    if (hasListingRef(threadId, listingParam)) return null; // already sent before
    const listing = getListingById(listingParam);
    if (!listing) return null;
    return { id: listing.id, model: listing.model, price: formatPrice(listing.price), active: true };
  });

  // If the URL param changes (e.g. user taps Reply on a *different* listing while already in the thread),
  // update the staged listing accordingly.
  useEffect(() => {
    if (!listingParam) return;
    if (hasListingRef(threadId, listingParam)) return;
    const listing = getListingById(listingParam);
    if (!listing) return;
    setStaged({ id: listing.id, model: listing.model, price: formatPrice(listing.price), active: true });
    // Auto-focus the textarea so the user can start typing immediately
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [listingParam, threadId]);

  // Keep local messages in sync when we navigate back to this thread
  useEffect(() => {
    setMessages(getMessages(threadId));
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function sendMessage() {
    const text = draft.trim();
    if (!text && !staged) return;

    const msg: ThreadMessage = {
      id: String(Date.now()),
      from: 'me',
      text: text || undefined,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      listing: staged ?? undefined,
    };
    addMessage(threadId, msg);
    setMessages(getMessages(threadId));
    setDraft('');
    setStaged(null);
    // Clean the ?listing= param from the URL without pushing a new history entry
    router.replace(`/design/messages/${threadId}`);
  }

  const canSend = draft.trim().length > 0 || staged !== null;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href={arrivedFromListing.current ? '/design' : '/design/messages'} className="text-muted-foreground transition-colors hover:text-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <Link href={`/design/u/${seller.handle}`} className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="size-9 rounded-full object-cover bg-foreground"
            />
            {seller.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-world-verified ring-1 ring-background">
                <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-2">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">{seller.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">View profile →</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 px-4 pb-40 pt-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-xl">💬</div>
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
              Reply to one of {seller.name.split(' ')[0]}&apos;s listings to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
              {/* Listing card always gets its own row, full-width */}
              {msg.listing && (
                <div className="w-full max-w-[85%]">
                  <ListingCard listing={msg.listing} />
                </div>
              )}
              {/* Text bubble — only if there's actual text */}
              {msg.text && (
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${msg.from === 'me' ? 'rounded-br-sm bg-foreground text-background' : 'rounded-bl-sm bg-muted text-foreground'}`}>
                  {msg.text}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground">{msg.sentAt}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose bar — fixed above bottom nav */}
      <div className="fixed bottom-[57px] left-0 right-0 z-20 border-t border-border bg-background px-4 pb-3 pt-2">
        <div className="mx-auto max-w-lg">
          {/* Staged listing attachment */}
          {staged && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-base">⌚</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{staged.model}</p>
                <p className="text-[11px] text-muted-foreground">{staged.price} · Active listing</p>
              </div>
              <button
                onClick={() => {
                  setStaged(null);
                  router.replace(`/design/messages/${threadId}`);
                }}
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground transition-colors hover:bg-muted-foreground/30 hover:text-foreground"
                aria-label="Remove listing"
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="size-3">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={staged ? 'Add a message…' : isEmpty ? `Message ${seller.name.split(' ')[0]}…` : 'Reply…'}
              className="flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              size="icon"
              className="shrink-0 rounded-full"
              onClick={sendMessage}
              disabled={!canSend}
              aria-label="Send message"
            >
              <Forward className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
