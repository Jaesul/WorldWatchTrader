'use client';

import { ExternalLink, PackageCheck } from 'lucide-react';

import type { DmShipmentSnapshotPayload } from '@/hooks/useDmThreadStream';

type Props = {
  shipment: DmShipmentSnapshotPayload;
  mine: boolean;
};

function formatUsd(v: number): string {
  return v.toLocaleString('en-US');
}

export function DmShipmentCard({ shipment, mine }: Props) {
  const { carrierName, trackingNumber, trackingUrl, linkedDeal } = shipment;

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full max-w-[280px] flex-col gap-2 rounded-2xl border p-2.5 text-left transition-colors ${
        mine
          ? 'border-white/25 bg-black/10 text-white hover:bg-black/15'
          : 'border-border bg-background text-foreground hover:bg-muted/40'
      }`}
      aria-label={`Open ${carrierName} tracking`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            mine ? 'text-white/80' : 'text-muted-foreground'
          }`}
        >
          Shipping update
        </p>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
            mine
              ? 'border-white/40 bg-white/20 text-white'
              : 'border-border bg-muted text-foreground'
          }`}
        >
          {carrierName}
        </span>
      </div>
      <div className="flex items-start gap-2.5">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
            mine ? 'bg-black/15 text-white' : 'bg-muted text-foreground'
          }`}
        >
          <PackageCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {trackingNumber ? (
            <p
              className={`truncate font-mono text-xs font-semibold ${
                mine ? 'text-white' : 'text-foreground'
              }`}
            >
              {trackingNumber}
            </p>
          ) : (
            <p
              className={`truncate text-xs font-semibold ${
                mine ? 'text-white' : 'text-foreground'
              }`}
            >
              Tracking link
            </p>
          )}
          {linkedDeal ? (
            <p
              className={`mt-0.5 line-clamp-2 text-[11px] ${
                mine ? 'text-white/80' : 'text-muted-foreground'
              }`}
            >
              For: {linkedDeal.listingTitle} · ${formatUsd(linkedDeal.priceUsd)}
            </p>
          ) : null}
        </div>
        <ExternalLink
          className={`size-3.5 shrink-0 ${
            mine ? 'text-white/70' : 'text-muted-foreground'
          }`}
        />
      </div>
      <p
        className={`text-[10px] font-medium ${
          mine ? 'text-white/70' : 'text-primary'
        }`}
      >
        Tap to open {carrierName} →
      </p>
    </a>
  );
}
