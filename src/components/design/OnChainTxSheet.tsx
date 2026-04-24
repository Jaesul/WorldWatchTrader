"use client";

import type { OnChainSettlement } from "@/lib/design/on-chain-sale-mock";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { OnChainSettlementDetails } from "./OnChainSettlementDetails";

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

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <OnChainSettlementDetails settlement={tx} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
