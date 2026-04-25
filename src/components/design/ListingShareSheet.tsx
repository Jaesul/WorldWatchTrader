'use client';

import Link from 'next/link';
import { Copy, Link2, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { addMessage } from '@/lib/design/thread-store';
import { DESIGN_SHARE_RECIPIENTS } from '@/lib/design/share-recipients';
import { formatPrice, type Listing } from '@/lib/design/data';
import { useDrawerResident } from '@/hooks/use-drawer-resident';
import { useRouteMode } from '@/lib/route-mode/RouteModeProvider';
import { cn } from '@/lib/utils';

function buildListingUrl(listingId: string) {
  if (typeof window === 'undefined') return `/design?listing=${listingId}`;
  return `${window.location.origin}/design?listing=${listingId}`;
}

function buildListingSummary(listing: Listing) {
  const url = buildListingUrl(listing.id);
  return `${listing.model}\n${formatPrice(listing.price)} · ${listing.seller.name}\n${url}`;
}

function iosGroupRowClass(edge: 'first' | 'middle' | 'last' | 'only') {
  return cn(
    'flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-foreground transition-colors active:bg-black/[0.04] dark:active:bg-white/[0.06]',
    edge === 'only' && 'rounded-xl',
    edge === 'first' && 'rounded-t-xl',
    edge === 'last' && 'rounded-b-xl',
    edge === 'middle' && 'rounded-none',
  );
}

export function ListingShareSheet({
  listing,
  open,
  onOpenChange,
}: {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const residentListing = useDrawerResident(listing);
  const { basePath } = useRouteMode();
  if (!residentListing) return null;

  /** Captured for async handlers — props may be typed as nullable at call time. */
  const activeListing = residentListing;
  const url = buildListingUrl(activeListing.id);
  const summary = buildListingSummary(activeListing);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Listing details copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  async function systemShare() {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: activeListing.model,
          text: `${formatPrice(activeListing.price)} · ${activeListing.seller.name}`,
          url,
        });
        return;
      }
      await copyLink();
      toast.info('Share is not available — link copied instead');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      toast.error('Share failed');
    }
  }

  function sendToThread(threadId: string, name: string) {
    const now = new Date();
    const sentAt = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    addMessage(threadId, {
      id: `share-${activeListing.id}-${now.getTime()}`,
      from: 'me',
      sentAt,
      listing: {
        id: activeListing.id,
        model: activeListing.model,
        price: formatPrice(activeListing.price),
        active: true,
      },
      text: 'Sharing this listing with you.',
    });
    toast.success(`Sent to ${name}`);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[60] mx-auto flex max-h-[min(88dvh,640px)] w-full max-w-lg flex-col rounded-t-2xl border-x px-4 pb-6 pt-2"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <SheetHeader className="space-y-1 pb-3 text-left">
          <SheetTitle className="text-base">Share listing</SheetTitle>
          <SheetDescription className="line-clamp-2 text-sm">
            {activeListing.model} · {formatPrice(activeListing.price)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="rounded-xl bg-muted/60 p-1">
            <button type="button" onClick={() => void copyLink()} className={iosGroupRowClass('first')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                <Link2 className="size-[18px] text-primary" />
              </span>
              <span className="min-w-0 flex-1">Copy link</span>
            </button>
            <div className="mx-4 h-px bg-border/80" />
            <button type="button" onClick={() => void copyDetails()} className={iosGroupRowClass('middle')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                <Copy className="size-[18px] text-primary" />
              </span>
              <span className="min-w-0 flex-1">Copy details</span>
            </button>
            <div className="mx-4 h-px bg-border/80" />
            <button type="button" onClick={() => void systemShare()} className={iosGroupRowClass('last')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                <Share2 className="size-[18px] text-primary" />
              </span>
              <span className="min-w-0 flex-1 text-left">Share…</span>
            </button>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Send in World Watch Trader
            </p>
            <div className="rounded-xl bg-muted/60 p-1">
              {DESIGN_SHARE_RECIPIENTS.map((r, i, arr) => {
                const edge =
                  arr.length === 1 ? 'only' : i === 0 ? 'first' : i === arr.length - 1 ? 'last' : 'middle';
                return (
                  <div key={r.threadId}>
                    {i > 0 ? <div className="mx-4 h-px bg-border/80" /> : null}
                    <button
                      type="button"
                      onClick={() => sendToThread(r.threadId, r.name)}
                      className={iosGroupRowClass(edge)}
                    >
                      <img src={r.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border" />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate">{r.name}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">@{r.handle}</span>
                      </span>
                      <MessageCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button variant="link" className="mt-1 h-auto px-1 py-2 text-xs text-muted-foreground" asChild>
              <Link href={`${basePath}/messages`} onClick={() => onOpenChange(false)}>
                Open messages
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
