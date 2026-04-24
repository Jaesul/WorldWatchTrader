"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useDrawerResident } from "@/hooks/use-drawer-resident";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import { OnChainSettlementDetails } from "@/components/design/OnChainSettlementDetails";
import type { MyListing } from "@/lib/design/listing-store";
import type {
  ViewerDashboardDealParty,
} from "@/lib/viewer/dashboard";
import type { OnChainSettlement } from "@/lib/design/on-chain-sale-mock";
import { buildMockPublicProfileSoldParts } from "@/lib/design/on-chain-sale-mock";
import { sellerPublicProfileSlug } from "@/lib/design/map-db-feed-to-listing";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MyListing | null;
};

function shortAddress(addr: string | null | undefined): string {
  if (!addr) return "";
  if (addr.length <= 9) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-3)}`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function formatConfirmed(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Build an {@link OnChainSettlement} from persisted deal values when present,
 * falling back to the deterministic mock helper for legacy rows that predate
 * the `listing_deals` backfill.
 */
function buildSettlement(listing: MyListing): OnChainSettlement {
  const deal = listing.deal;
  if (deal) {
    return {
      txHash: deal.txHash ?? "",
      blockNumber: deal.blockNumber ?? 0,
      chainName: deal.chainName,
      token: deal.tokenSymbol,
      amount: deal.amountRaw,
      confirmedAtLabel: formatConfirmed(deal.confirmedAt),
    };
  }
  const { settlement } = buildMockPublicProfileSoldParts({
    listingId: listing.id,
    updatedAt: new Date(),
    priceUsd: listing.price,
  });
  return settlement;
}

function CounterpartyCard({ party }: { party: ViewerDashboardDealParty }) {
  const slug = sellerPublicProfileSlug({
    id: party.id,
    handle: party.handle,
  });
  const avatar =
    party.profilePictureUrl ??
    `https://i.pravatar.cc/150?u=${encodeURIComponent(party.id)}`;

  return (
    <Link
      href={`/design/u/${slug}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:bg-muted/40"
    >
      <img
        src={avatar}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover bg-muted"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {party.username}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {shortAddress(party.walletAddress)}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function SoldListingReceiptDrawer({
  open,
  onOpenChange,
  listing,
}: Props) {
  const residentListing = useDrawerResident(listing);
  if (!residentListing) return null;

  const deal = residentListing.deal;
  const isPurchase = residentListing.perspective === "purchase";
  const settlement = buildSettlement(residentListing);
  const chainId = deal?.chainId;
  const salePrice = deal?.priceUsd ?? residentListing.price;

  const title = isPurchase ? "Purchase receipt" : "Sale receipt";
  const description = isPurchase
    ? "Record of this purchase and its on-chain settlement."
    : "Record of this sale and its on-chain settlement.";
  const counterpartyLabel = isPurchase ? "Seller" : "Buyer";
  const counterparty: ViewerDashboardDealParty | null = deal
    ? isPurchase
      ? (deal.seller ?? null)
      : deal.buyer
    : null;

  const statusChip = isPurchase
    ? "mt-1 inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700"
    : "mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700";
  const statusLabel = isPurchase ? "Purchased" : "Sold";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col px-0 pb-0">
        <DrawerHeader className="px-4 pb-2 text-left">
          <DrawerTitle className="text-base">{title}</DrawerTitle>
          <DrawerDescription className="text-xs">
            {description}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
          <section className="rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={residentListing.photo}
                  alt={residentListing.model}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {residentListing.model}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {residentListing.condition || "—"}
                </p>
                <p className="mt-1.5 text-lg font-bold text-foreground">
                  {formatUsd(salePrice)}
                </p>
                <span className={statusChip}>
                  <WorldOrbIcon className="size-2.5 shrink-0" />
                  {statusLabel}
                </span>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {counterpartyLabel}
            </p>
            {counterparty ? (
              <CounterpartyCard party={counterparty} />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                {counterpartyLabel} details aren&apos;t available yet.
              </div>
            )}
          </section>

          {deal?.shipment ? (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Shipping
              </p>
              <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-sm text-foreground">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-700">
                  <PackageCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    Shipped via {deal.shipment.carrierName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Open the conversation to view the tracking number.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              On-chain settlement
            </p>
            <OnChainSettlementDetails
              settlement={settlement}
              chainId={chainId}
            />
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
