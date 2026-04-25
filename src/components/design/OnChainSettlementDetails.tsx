"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { OnChainSettlement } from "@/lib/design/on-chain-sale-mock";
import { explorerTxUrl } from "@/lib/design/on-chain-sale-mock";
import { isExplorerTxHash } from "@/lib/settlement/receipt-settlement";

type Props = {
  settlement: OnChainSettlement;
  chainId?: number;
};

export function OnChainSettlementDetails({ settlement, chainId }: Props) {
  const tx = settlement;
  const trimmedHash = tx.txHash.trim();
  const looksLikeExplorerHash = trimmedHash.length > 0 && isExplorerTxHash(trimmedHash);
  const explorerEligible = tx.explorerLinkEligible !== false;
  const explorerTarget =
    looksLikeExplorerHash && explorerEligible ? trimmedHash : null;
  const explorerHref = explorerTarget ? explorerTxUrl(explorerTarget, chainId) : null;
  const hashLabel =
    explorerTarget != null
      ? "Transaction hash"
      : looksLikeExplorerHash
        ? "Recorded hash"
        : trimmedHash.length > 0
          ? "Payment reference"
          : "Transaction hash";

  function copyHash() {
    if (!trimmedHash) return;
    void navigator.clipboard.writeText(tx.txHash);
    toast.success("Copied");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {hashLabel}
        </p>
        <div className="mt-1 flex items-start gap-2">
          <p className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
            {trimmedHash.length > 0 ? tx.txHash : "—"}
          </p>
          {trimmedHash.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={copyHash}
              aria-label="Copy"
            >
              <Copy className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <dt className="text-[10px] font-medium uppercase text-muted-foreground">
            Chain
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{tx.chainName}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <dt className="text-[10px] font-medium uppercase text-muted-foreground">
            Asset
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{tx.token}</dd>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-background px-3 py-2">
          <dt className="text-[10px] font-medium uppercase text-muted-foreground">
            Amount
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{tx.amount}</dd>
        </div>
      </dl>

      <div className="rounded-lg border border-border bg-background px-3 py-2">
        <p className="text-[10px] font-medium uppercase text-muted-foreground">
          Confirmed
        </p>
        <p className="mt-0.5 text-sm text-foreground">{tx.confirmedAtLabel}</p>
      </div>

      {explorerHref ? (
        <div className="space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <a href={explorerHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              View on Worldscan
            </a>
          </Button>
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            From payment verification when present — not a documented guaranteed L2 explorer id. If
            Worldscan shows nothing, the payment can still be valid.
          </p>
        </div>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground">
          {trimmedHash.length > 0
            ? looksLikeExplorerHash
              ? "Worldscan is omitted for sandbox / seed transactions (the hex is not a real chain tx)."
              : "Explorer link appears when a Worldscan-style transaction hash is available."
            : null}
        </p>
      )}
    </div>
  );
}
