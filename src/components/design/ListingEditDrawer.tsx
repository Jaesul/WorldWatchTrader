'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useDesignViewer } from '@/lib/design/DesignViewerProvider';
import { blockDesignInteractionWithoutWorldId } from '@/lib/design/world-id-interaction-gate';
import { BOX_PAPERS, CONDITIONS, CURRENCIES } from '@/lib/design/listing-form-constants';
import { STATUS_CONFIG } from '@/lib/design/listing-status-config';
import type { ListingStatus, MyListing } from '@/lib/design/listing-store';

function teaserFromDetails(details: string): string {
  const d = details.trim();
  if (!d) return '';
  return d.length <= 160 ? d : `${d.slice(0, 157)}…`;
}

function buildDetailsBody(description: string, boxPapers: string): string {
  let details = description.trim();
  if (boxPapers.trim()) {
    details += `\n\nBox & papers: ${boxPapers.trim()}`;
  }
  return details;
}

export function ListingEditDrawer({
  listing,
  open,
  onClose,
  onRequestSold,
  onAfterMutate,
}: {
  listing: MyListing;
  open: boolean;
  onClose: () => void;
  onRequestSold: (listing: MyListing) => void;
  onAfterMutate?: () => void | Promise<void>;
}) {
  const { viewer } = useDesignViewer();
  const orbGate = { viewerOrbVerified: viewer?.orbVerified === true };
  const [model, setModel] = useState(listing.model);
  const [price, setPrice] = useState(String(listing.price));
  const [currency, setCurrency] = useState(listing.currency);
  const [description, setDescription] = useState(listing.description);
  const [condition, setCondition] = useState(listing.condition);
  const [boxPapers, setBoxPapers] = useState(listing.boxPapers);
  const [status, setStatus] = useState<ListingStatus>(listing.status);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);

  const usdOnly = listing.currency === 'USD';

  const isDirty =
    model !== listing.model ||
    price !== String(listing.price) ||
    (!usdOnly && currency !== listing.currency) ||
    description !== listing.description ||
    condition !== listing.condition ||
    boxPapers !== listing.boxPapers ||
    status !== listing.status;

  async function handleSave() {
    if (blockDesignInteractionWithoutWorldId(orbGate)) return;
    if (usdOnly && currency !== 'USD') {
      setFooterError('Listings are priced in USD only.');
      return;
    }
    const priceUsd = Math.round(Number.parseFloat(price) || listing.price);
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setFooterError('Enter a valid whole-dollar price.');
      return;
    }
    const details = buildDetailsBody(description, boxPapers);
    const teaser = teaserFromDetails(details);

    setFooterError(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/design/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: model.trim(),
          priceUsd,
          teaser,
          details,
          condition: condition.trim() || null,
          status,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setFooterError(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      await onAfterMutate?.();
      onClose();
      toast.success('Listing updated');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (blockDesignInteractionWithoutWorldId(orbGate)) return;
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setFooterError(null);
    setDeleting(true);
    try {
      const r = await fetch(`/api/design/listings/${listing.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setFooterError(typeof j.error === 'string' ? j.error : 'Delete failed');
        return;
      }
      await onAfterMutate?.();
      onClose();
      toast.success('Listing deleted');
    } finally {
      setDeleting(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    } else {
      setModel(listing.model);
      setPrice(String(listing.price));
      setCurrency(listing.currency);
      setDescription(listing.description);
      setCondition(listing.condition);
      setBoxPapers(listing.boxPapers);
      setStatus(listing.status);
      setShowDetails(false);
      setFooterError(null);
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto">
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <img
              src={listing.photo}
              alt={listing.model}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 left-4 text-xs font-medium text-white/80">
              {listing.postedAt}
            </span>
          </div>

          <DrawerHeader className="pb-0">
            <DrawerTitle>Edit listing</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-5 px-4 pb-2 pt-3">
            <section>
              <p className="mb-2 text-sm font-semibold text-foreground">Status</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {(Object.entries(STATUS_CONFIG) as [ListingStatus, (typeof STATUS_CONFIG)[ListingStatus]][]).map(
                  ([s, cfg]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (s === 'sold') {
                          if (blockDesignInteractionWithoutWorldId(orbGate)) return;
                          onRequestSold(listing);
                          onClose();
                        } else {
                          if (blockDesignInteractionWithoutWorldId(orbGate)) return;
                          setStatus(s);
                        }
                      }}
                      className={`rounded-lg border px-3 py-2 text-left transition-all ${
                        status === s
                          ? cfg.color + ' ring-1 ring-inset ring-current/30'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${status === s ? '' : 'text-foreground'}`}
                      >
                        {cfg.label}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-tight opacity-70">{cfg.description}</p>
                    </button>
                  ),
                )}
              </div>
            </section>

            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Model / reference
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </section>

            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Price</label>
              <div className="flex gap-2">
                {usdOnly ? (
                  <span className="flex h-10 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                    USD
                  </span>
                ) : (
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>
            </section>

            <section>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </section>

            <div>
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {showDetails ? 'Hide' : 'Show'} optional details
              </button>
            </div>

            {showDetails && (
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <section>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCondition(condition === c ? '' : c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          condition === c
                            ? 'bg-foreground text-background'
                            : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Box &amp; papers</label>
                  <div className="flex flex-wrap gap-2">
                    {BOX_PAPERS.map((bp) => (
                      <button
                        key={bp}
                        type="button"
                        onClick={() => setBoxPapers(boxPapers === bp ? '' : bp)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          boxPapers === bp
                            ? 'bg-foreground text-background'
                            : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {bp}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t border-border pt-3">
          {footerError ? (
            <p
              className="mb-2 text-center text-sm text-destructive"
              role="alert"
            >
              {footerError}
            </p>
          ) : null}
          <Button onClick={() => void handleSave()} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:text-rose-500 hover:underline disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete listing'}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
