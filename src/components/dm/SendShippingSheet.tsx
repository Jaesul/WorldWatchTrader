'use client';

import { Check, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  DmShipmentLinkedDealPayload,
  DmShipmentSnapshotPayload,
  DmStreamMessage,
} from '@/hooks/useDmThreadStream';
import {
  CARRIERS,
  type CarrierCode,
  carrierName as lookupCarrierName,
  detectCarrier,
  isValidTrackingUrl,
  normalizeTrackingNumber,
} from '@/lib/design/shipping-carriers';

type LinkableDeal = {
  dealId: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  priceUsd: number;
  confirmedAt: string | null;
  alreadyShipped: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  onSent?: (message: DmStreamMessage, shipment: DmShipmentSnapshotPayload) => void;
};

function formatUsd(v: number) {
  return v.toLocaleString('en-US');
}

export function SendShippingSheet({ open, onOpenChange, threadId, onSent }: Props) {
  const [tracking, setTracking] = useState('');
  const [manualCarrier, setManualCarrier] = useState<CarrierCode | null>(null);
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deals, setDeals] = useState<LinkableDeal[] | null>(null);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTracking('');
      setManualCarrier(null);
      setUseUrlMode(false);
      setTrackingUrl('');
      setDeals(null);
      setDealsError(null);
      setSelectedDealId(null);
      setSubmitting(false);
    }
  }, [open]);

  const loadDeals = useCallback(async () => {
    setDealsError(null);
    try {
      const res = await fetch(
        `/api/design/dm/threads/${threadId}/shipments/linkable-deals`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        setDeals([]);
        return;
      }
      const data = (await res.json()) as { deals?: LinkableDeal[] };
      setDeals(data.deals ?? []);
    } catch {
      setDealsError('Could not load linkable sales.');
      setDeals([]);
    }
  }, [threadId]);

  useEffect(() => {
    if (!open) return;
    void loadDeals();
  }, [open, loadDeals]);

  const normalized = useMemo(() => normalizeTrackingNumber(tracking), [tracking]);
  const detected = useMemo(
    () => (normalized ? detectCarrier(normalized) : null),
    [normalized],
  );

  const effectiveCarrier: CarrierCode | null = useUrlMode
    ? manualCarrier ?? 'other'
    : manualCarrier ?? detected?.code ?? null;

  const urlLooksValid = trackingUrl ? isValidTrackingUrl(trackingUrl) : false;

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (useUrlMode) {
      return urlLooksValid;
    }
    if (!normalized) return false;
    if (effectiveCarrier === 'other') {
      return urlLooksValid;
    }
    return !!effectiveCarrier;
  }, [submitting, useUrlMode, urlLooksValid, normalized, effectiveCarrier]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (useUrlMode) {
        body.trackingUrl = trackingUrl.trim();
        body.carrierCode = manualCarrier ?? 'other';
      } else {
        body.trackingNumber = normalized;
        if (manualCarrier) body.carrierCode = manualCarrier;
        if (effectiveCarrier === 'other' && trackingUrl) {
          body.trackingUrl = trackingUrl.trim();
        }
      }
      if (selectedDealId) body.linkedDealId = selectedDealId;

      const res = await fetch(
        `/api/design/dm/threads/${threadId}/shipments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        shipment?: DmShipmentSnapshotPayload;
        message?: DmStreamMessage;
        error?: string;
      };
      if (!res.ok || !data.shipment || !data.message) {
        const err = data.error;
        toast.error(
          err === 'invalid_tracking_url'
            ? 'Please provide a valid tracking URL.'
            : err === 'missing_tracking'
              ? 'Enter a tracking number or URL.'
              : err === 'deal_not_linkable'
                ? 'That sale can no longer be linked.'
                : typeof err === 'string'
                  ? err
                  : 'Could not send shipping info',
        );
        return;
      }
      toast.success('Shipping info sent');
      onSent?.(data.message, data.shipment);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const linkedDealPreview: DmShipmentLinkedDealPayload | null = useMemo(() => {
    if (!selectedDealId || !deals) return null;
    const d = deals.find((x) => x.dealId === selectedDealId);
    if (!d) return null;
    return {
      dealId: d.dealId,
      listingId: d.listingId,
      listingTitle: d.listingTitle,
      listingImageUrl: d.listingImageUrl,
      priceUsd: d.priceUsd,
      confirmedAt: d.confirmedAt,
    };
  }, [selectedDealId, deals]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (typeof next !== 'boolean') return;
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-5"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Send shipping info</SheetTitle>
          <SheetDescription className="text-xs">
            Share a tracking number and we&apos;ll auto-detect the carrier. The
            message becomes a tap-to-open link to the carrier&apos;s tracking
            page.
          </SheetDescription>
        </SheetHeader>

        {!useUrlMode ? (
          <div className="mb-4">
            <label
              htmlFor="ship-tracking"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Tracking number
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-ring">
              <input
                id="ship-tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                className="h-10 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
              />
              {detected && !manualCarrier ? (
                <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {detected.name}
                </span>
              ) : null}
            </div>
            {normalized && !detected && !manualCarrier ? (
              <p className="mt-1 text-[10px] text-amber-700">
                Couldn&apos;t detect the carrier. Pick one below or paste a
                tracking URL.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setUseUrlMode(true);
                setTracking('');
                setManualCarrier(null);
              }}
              className="mt-2 text-[11px] font-medium text-primary underline"
            >
              Have a link instead?
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <label
              htmlFor="ship-url"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Tracking URL
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-ring">
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="ship-url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://…"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {trackingUrl && !urlLooksValid ? (
              <p className="mt-1 text-[10px] text-rose-600">
                That URL doesn&apos;t look valid.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setUseUrlMode(false);
                setTrackingUrl('');
              }}
              className="mt-2 text-[11px] font-medium text-primary underline"
            >
              Use a tracking number instead
            </button>
          </div>
        )}

        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Carrier
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {CARRIERS.map((c) => {
              const isAuto =
                !manualCarrier && !useUrlMode && detected?.code === c.code;
              const isSelected =
                manualCarrier === c.code ||
                (!manualCarrier && useUrlMode && c.code === 'other') ||
                isAuto;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setManualCarrier(c.code)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    isSelected
                      ? 'border-foreground bg-foreground/5 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {c.name}
                  {isAuto ? (
                    <span className="ml-1 text-[9px] font-medium text-emerald-700">
                      auto
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {!useUrlMode && effectiveCarrier === 'other' ? (
            <div className="mt-2">
              <label
                htmlFor="ship-other-url"
                className="text-[10px] text-muted-foreground"
              >
                &quot;Other&quot; needs a tracking URL
              </label>
              <input
                id="ship-other-url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
              />
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Link to sale (optional)
          </p>
          {deals === null ? (
            <p className="mt-1 text-[11px] text-muted-foreground">Loading…</p>
          ) : dealsError ? (
            <p className="mt-1 text-[11px] text-rose-600">{dealsError}</p>
          ) : deals.length === 0 ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              No confirmed sales with this buyer yet.
            </p>
          ) : (
            <div className="mt-1 flex max-h-[24dvh] flex-col gap-1.5 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedDealId(null)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  selectedDealId === null
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <span className="text-foreground">No linked sale</span>
                {selectedDealId === null ? (
                  <Check className="size-3.5 shrink-0 text-foreground" />
                ) : null}
              </button>
              {deals.map((d) => {
                const isSel = selectedDealId === d.dealId;
                return (
                  <button
                    key={d.dealId}
                    type="button"
                    onClick={() => setSelectedDealId(d.dealId)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      isSel
                        ? 'border-foreground bg-foreground/5'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    {d.listingImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.listingImageUrl}
                        alt=""
                        className="size-9 shrink-0 rounded-md object-cover bg-muted"
                      />
                    ) : (
                      <div className="size-9 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {d.listingTitle}
                      </p>
                      <p className="text-muted-foreground">
                        ${formatUsd(d.priceUsd)}
                        {d.alreadyShipped ? ' · already shipped once' : ''}
                      </p>
                    </div>
                    {isSel ? (
                      <Check className="size-3.5 shrink-0 text-foreground" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {linkedDealPreview ? (
          <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Will link this shipment to:{' '}
            <span className="font-medium text-foreground">
              {linkedDealPreview.listingTitle}
            </span>
          </div>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={!canSubmit}
          onClick={() => void onSubmit()}
        >
          {submitting
            ? 'Sending…'
            : useUrlMode
              ? `Send tracking link${manualCarrier ? ` via ${lookupCarrierName(manualCarrier)}` : ''}`
              : `Send tracking${effectiveCarrier && effectiveCarrier !== 'other' ? ` via ${lookupCarrierName(effectiveCarrier)}` : ''}`}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
