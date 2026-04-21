"use client";

import { toast } from "sonner";
import { ExternalLink, Copy } from "lucide-react";

import type { OnChainSettlement } from "@/lib/design/on-chain-sale-mock";
import { explorerTxUrl } from "@/lib/design/on-chain-sale-mock";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function OnChainTxSheet({
  settlement,
  open,
  onOpenChange,
}: {
  settlement: OnChainSettlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!settlement) return null;

  const tx = settlement;

  function copyHash() {
    void navigator.clipboard.writeText(tx.txHash);
    toast.success("Transaction hash copied");
  }

  const explorerHref = explorerTxUrl(tx.txHash);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border-x px-0 pb-0"
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <SheetHeader className="px-4 pb-2 text-left">
          <SheetTitle className="text-base">On-chain settlement</SheetTitle>
          <SheetDescription>
            This sale was finalized through in-app escrow and recorded on{" "}
            {tx.chainName}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Transaction hash
            </p>
            <div className="mt-1 flex items-start gap-2">
              <p className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
                {tx.txHash}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={copyHash}
                aria-label="Copy transaction hash"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <dt className="text-[10px] font-medium uppercase text-muted-foreground">
                Chain
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {tx.chainName}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <dt className="text-[10px] font-medium uppercase text-muted-foreground">
                Block
              </dt>
              <dd className="mt-0.5 font-mono text-foreground">
                {tx.blockNumber.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <dt className="text-[10px] font-medium uppercase text-muted-foreground">
                Asset
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">{tx.token}</dd>
            </div>
            <div className="rounded-lg border border-border bg-background px-3 py-2">
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

          <Button variant="outline" className="w-full" asChild>
            <a href={explorerHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              View on explorer
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
