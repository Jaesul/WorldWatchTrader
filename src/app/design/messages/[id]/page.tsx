'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Camera, Forward, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  getMessages,
  addMessage,
  hasListingRef,
  threadHasCounterpartySharedMyListing,
  type ThreadMessage,
} from '@/lib/design/thread-store';
import { getListingById, formatPrice, type Listing } from '@/lib/design/data';
import type { MyListing } from '@/lib/design/listing-store';
import { useViewerDashboardListings } from '@/lib/design/use-viewer-dashboard-listings';
import { MarkSoldSheet, type PlatformUser } from '@/components/design/MarkSoldSheet';
import { ThreadMarkListingSheet } from '@/components/design/ThreadMarkListingSheet';
import { getListingAttachmentThumbnail } from '@/lib/design/listing-attachment-thumb';
import { cn } from '@/lib/utils';
import { blockDesignInteractionWithoutWorldId } from '@/lib/design/world-id-interaction-gate';

const MAX_IMAGES_PER_MESSAGE = 6;

function readImageFilesAsDataUrls(files: FileList | null, max: number): Promise<string[]> {
  if (!files?.length || max <= 0) return Promise.resolve([]);
  const list = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, max);
  return Promise.all(
    list.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        }),
    ),
  ).then((urls) => urls.filter(Boolean));
}

const SELLER_INFO: Record<string, { name: string; handle: string; verified: boolean; avatar: string }> = {
  'seller-alexkim': { name: 'Alex Kim', handle: 'alexkim', verified: true, avatar: 'https://i.pravatar.cc/150?u=alexkim' },
  'seller-harbortime': { name: 'Harbor Time Co.', handle: 'harbortime', verified: true, avatar: 'https://i.pravatar.cc/150?u=harbortime' },
  'seller-marcor': { name: 'Marco R.', handle: 'marcor', verified: false, avatar: 'https://i.pravatar.cc/150?u=marcor' },
};

type ThreadListingAttachment = NonNullable<ThreadMessage['listing']>;

type ThreadListingDrawerState =
  | { kind: 'feed'; listing: Listing }
  | { kind: 'mine'; listing: MyListing }
  | { kind: 'inline'; listing: ThreadListingAttachment };

function resolveListingDrawerState(
  listing: ThreadListingAttachment,
  myListings: MyListing[],
): ThreadListingDrawerState {
  if (listing.isMyListing) {
    const mine = myListings.find((l) => l.id === listing.id);
    if (mine) return { kind: 'mine', listing: mine };
  }
  const feed = getListingById(listing.id);
  if (feed) return { kind: 'feed', listing: feed };
  return { kind: 'inline', listing };
}

function formatMyListingPrice(price: number, currency: string) {
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF ' : '$';
  return sym + price.toLocaleString('en-US');
}

function ListingCard({
  listing,
  myListings,
  onOpen,
}: {
  listing: ThreadListingAttachment;
  myListings: MyListing[];
  onOpen: () => void;
}) {
  const thumb = getListingAttachmentThumbnail(listing, myListings);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors',
        listing.active ? 'border-border bg-muted/40 hover:bg-muted/70' : 'border-border/40 bg-muted/20 opacity-60',
      )}
    >
      {thumb ? (
        <img src={thumb} alt="" className="size-10 shrink-0 rounded-lg object-cover bg-muted" />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{listing.model}</p>
        <p className="text-[11px] text-muted-foreground">{listing.price} · {listing.active ? 'Active listing' : 'Listing ended'}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-0.5 size-4 shrink-0 text-muted-foreground/50">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function ThreadListingDrawer({
  state,
  myListings,
  onOpenChange,
  onReplyInChat,
}: {
  state: ThreadListingDrawerState | null;
  myListings: MyListing[];
  onOpenChange: (open: boolean) => void;
  onReplyInChat: (payload: ThreadListingAttachment) => void;
}) {
  const open = state !== null;
  const inlineThumb =
    state?.kind === 'inline' ? getListingAttachmentThumbnail(state.listing, myListings) : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92vh] max-w-lg">
        {state?.kind === 'feed' && (
          <>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{state.listing.model}</DrawerTitle>
              <DrawerDescription>Listing details</DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[calc(92vh-5rem)] overflow-y-auto">
              <div className="flex gap-2 overflow-x-auto bg-muted px-2 py-2" style={{ scrollbarWidth: 'none' }}>
                {state.listing.photos.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-44 w-36 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
              <div className="px-4 pb-2 pt-3">
                <p className="text-xl font-bold text-foreground">{formatPrice(state.listing.price)}</p>
                <h2 className="mt-1 text-base font-semibold leading-snug text-foreground">{state.listing.model}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.listing.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.condition}</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.boxPapers}</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.postedAt}</span>
                </div>
                <Link
                  href={`/design/u/${state.listing.seller.handle}`}
                  className="mt-4 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <img src={state.listing.seller.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover bg-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{state.listing.seller.name}</p>
                    <p className="text-[11px] text-muted-foreground">Seller</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4 shrink-0 text-muted-foreground/50">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
            <DrawerFooter className="border-t border-border pt-2">
              <Button
                className="w-full rounded-full"
                onClick={() => {
                  if (blockDesignInteractionWithoutWorldId()) return;
                  const l = state.listing;
                  onReplyInChat({
                    id: l.id,
                    model: l.model,
                    price: formatPrice(l.price),
                    active: true,
                  });
                }}
              >
                Reply in this chat
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full rounded-full">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}

        {state?.kind === 'mine' && (
          <>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{state.listing.model}</DrawerTitle>
              <DrawerDescription>Your listing</DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[calc(92vh-5rem)] overflow-y-auto">
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <img src={state.listing.photo} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="px-4 pb-2 pt-3">
                <p className="text-xl font-bold text-foreground">{formatMyListingPrice(state.listing.price, state.listing.currency)}</p>
                <h2 className="mt-1 text-base font-semibold leading-snug text-foreground">{state.listing.model}</h2>
                <p className="mt-1 text-xs capitalize text-muted-foreground">Status: {state.listing.status}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.listing.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.condition}</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.boxPapers}</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5">{state.listing.postedAt}</span>
                </div>
              </div>
            </div>
            <DrawerFooter className="border-t border-border pt-2">
              <Button asChild className="w-full rounded-full">
                <Link href="/design/profile">View on profile</Link>
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full rounded-full">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}

        {state?.kind === 'inline' && (
          <>
            <DrawerHeader>
              <DrawerTitle className="text-left">{state.listing.model}</DrawerTitle>
              <DrawerDescription className="text-left">{state.listing.price}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {inlineThumb ? (
                <img src={inlineThumb} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />
              ) : null}
              <p className="text-sm text-muted-foreground">
                Full details aren&apos;t available for this listing in the preview. You can still reference it in chat.
              </p>
            </div>
            <DrawerFooter className="border-t border-border pt-2">
              {!state.listing.isMyListing && (
                <Button
                  className="w-full rounded-full"
                  onClick={() => {
                    if (blockDesignInteractionWithoutWorldId()) return;
                    onReplyInChat({ ...state.listing });
                  }}
                >
                  Attach in this chat
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline" className="w-full rounded-full">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
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
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sold sheet — opened when user taps "Mark as sold" on their own listing card in a thread
  const myListings = useViewerDashboardListings();
  const [soldSheetListingId, setSoldSheetListingId] = useState<string | null>(null);
  const soldSheetListing = soldSheetListingId
    ? myListings.find((l) => l.id === soldSheetListingId) ?? null
    : null;
  const [threadMarkSheetOpen, setThreadMarkSheetOpen] = useState(false);
  const activeListingsForThread = myListings.filter((l) => l.status === 'active');
  const showMarkListingFromThreadButton = useMemo(
    () => threadHasCounterpartySharedMyListing(
      messages,
      myListings.map((l) => l.id),
    ),
    [messages, myListings],
  );
  const threadBuyer: PlatformUser | null = SELLER_INFO[threadId]
    ? { ...SELLER_INFO[threadId] }
    : null;

  const [listingDrawer, setListingDrawer] = useState<ThreadListingDrawerState | null>(null);

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

  async function handleImageFilesChosen(files: FileList | null) {
    if (blockDesignInteractionWithoutWorldId()) return;
    const room = MAX_IMAGES_PER_MESSAGE - pendingImages.length;
    if (room <= 0 || !files?.length) return;
    const urls = await readImageFilesAsDataUrls(files, room);
    setPendingImages((prev) => [...prev, ...urls]);
  }

  function sendMessage() {
    if (blockDesignInteractionWithoutWorldId()) return;
    const text = draft.trim();
    const imgs = pendingImages;
    if (!text && !staged && imgs.length === 0) return;

    const msg: ThreadMessage = {
      id: String(Date.now()),
      from: 'me',
      text: text || undefined,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      images: imgs.length > 0 ? imgs : undefined,
      listing: staged ?? undefined,
    };
    addMessage(threadId, msg);
    setMessages(getMessages(threadId));
    setDraft('');
    setStaged(null);
    setPendingImages([]);
    // Clean the ?listing= param from the URL without pushing a new history entry
    router.replace(`/design/messages/${threadId}`);
  }

  const canSend = draft.trim().length > 0 || staged !== null || pendingImages.length > 0;
  const isEmpty = messages.length === 0;
  const stagedThumb = staged ? getListingAttachmentThumbnail(staged, myListings) : null;

  function handleReplyInChatFromDrawer(payload: ThreadListingAttachment) {
    if (blockDesignInteractionWithoutWorldId()) return;
    setStaged(payload);
    setListingDrawer(null);
    router.replace(`/design/messages/${threadId}`);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-3 sm:gap-3 sm:px-4">
        <Link href={arrivedFromListing.current ? '/design' : '/design/messages'} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <Link href={`/design/u/${seller.handle}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative shrink-0">
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
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none text-foreground">{seller.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">View profile →</p>
          </div>
        </Link>
        {showMarkListingFromThreadButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto h-auto max-w-[7.25rem] shrink-0 whitespace-normal px-2 py-1.5 text-center text-[10px] font-semibold leading-tight sm:max-w-none sm:px-3 sm:text-xs sm:leading-snug"
            onClick={() => {
              if (blockDesignInteractionWithoutWorldId()) return;
              setThreadMarkSheetOpen(true);
            }}
          >
            Mark a listing as sold
          </Button>
        )}
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
          messages.map((msg) => {
            const myListing = msg.listing?.isMyListing
              ? myListings.find((l) => l.id === msg.listing!.id) ?? null
              : null;
            const canMarkSold = myListing?.status === 'active' || myListing?.status === 'pending';
            return (
              <div key={msg.id} className={`flex flex-col gap-1 ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
                {/* Listing card always gets its own row, full-width */}
                {msg.listing && (
                  <div className="w-full max-w-[85%]">
                    <ListingCard
                      listing={msg.listing}
                      myListings={myListings}
                      onOpen={() => setListingDrawer(resolveListingDrawerState(msg.listing!, myListings))}
                    />
                    {/* Mark as sold chip — only for my own active/pending listings */}
                    {canMarkSold && (
                      <button
                        onClick={() => {
                          if (blockDesignInteractionWithoutWorldId()) return;
                          setSoldSheetListingId(msg.listing!.id);
                        }}
                        className="mt-1 flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        <span className="text-[10px]">✓</span> Mark as sold
                      </button>
                    )}
                  </div>
                )}
                {msg.images && msg.images.length > 0 && (
                  <div
                    className={cn(
                      'flex max-w-[78%] flex-col gap-1',
                      msg.from === 'me' ? 'items-end' : 'items-start',
                    )}
                  >
                    <div
                      className={cn(
                        'grid gap-1 overflow-hidden rounded-2xl',
                        msg.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
                      )}
                    >
                      {msg.images.map((src, i) => (
                        <img
                          key={`${msg.id}-img-${i}`}
                          src={src}
                          alt=""
                          className="max-h-52 w-full object-cover sm:max-h-64"
                        />
                      ))}
                    </div>
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
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose bar — fixed above bottom nav */}
      <div className="fixed bottom-[57px] left-0 right-0 z-20 border-t border-border bg-background px-4 pb-3 pt-2">
        <div className="mx-auto max-w-lg">
          {/* Staged listing attachment */}
          {staged && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
              {stagedThumb ? (
                <img
                  src={stagedThumb}
                  alt=""
                  className="size-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-base">⌚</div>
              )}
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

          {pendingImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingImages.map((src, i) => (
                <div key={`pending-${i}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-foreground"
                    aria-label="Remove photo"
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="size-3">
                      <line x1="2" y1="2" x2="10" y2="10" />
                      <line x1="10" y1="2" x2="2" y2="10" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => {
              void handleImageFilesChosen(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void handleImageFilesChosen(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Input row */}
          <div className="flex items-center gap-1.5">
            <div className="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => galleryInputRef.current?.click()}
                disabled={pendingImages.length >= MAX_IMAGES_PER_MESSAGE}
                aria-label="Add photos from library"
              >
                <ImagePlus className="size-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => cameraInputRef.current?.click()}
                disabled={pendingImages.length >= MAX_IMAGES_PER_MESSAGE}
                aria-label="Take photo with camera"
              >
                <Camera className="size-5" />
              </Button>
            </div>
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
              className="min-h-10 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2 text-sm leading-snug outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              onClick={sendMessage}
              disabled={!canSend}
              aria-label="Send message"
            >
              <Forward className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <ThreadListingDrawer
        state={listingDrawer}
        myListings={myListings}
        onOpenChange={(isOpen) => { if (!isOpen) setListingDrawer(null); }}
        onReplyInChat={handleReplyInChatFromDrawer}
      />

      <ThreadMarkListingSheet
        open={threadMarkSheetOpen}
        onOpenChange={setThreadMarkSheetOpen}
        activeListings={activeListingsForThread}
        chatPartnerShortName={seller.name.split(' ')[0] ?? seller.name}
        onRequestMarkSold={(listing) => {
          if (blockDesignInteractionWithoutWorldId()) return;
          setSoldSheetListingId(listing.id);
        }}
      />

      {/* Mark as sold sheet — from listing cards in thread or header flow */}
      {soldSheetListing && (
        <MarkSoldSheet
          open={!!soldSheetListing}
          onOpenChange={(open) => { if (!open) setSoldSheetListingId(null); }}
          listing={soldSheetListing}
          previousStatus={soldSheetListing.status}
          prefilledBuyer={threadBuyer}
          onSold={() => setSoldSheetListingId(null)}
        />
      )}
    </div>
  );
}
