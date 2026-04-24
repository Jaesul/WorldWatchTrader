'use client';

import { ArrowRight, Inbox, Send, Truck } from 'lucide-react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSend: () => void;
  onSelectShipping: () => void;
  onSelectList: () => void;
  hasGlobalPending: boolean;
};

export function DmThreadMenuDrawer({
  open,
  onOpenChange,
  onSelectSend,
  onSelectShipping,
  onSelectList,
  hasGlobalPending,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="px-0 text-left">
          <DrawerTitle>Thread actions</DrawerTitle>
          <DrawerDescription className="text-xs">
            Manage transaction requests and shipping for this conversation.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSelectSend();
            }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Send className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold text-foreground">
                Send transaction
              </span>
              <span className="text-xs text-muted-foreground">
                Request a purchase of one of your listings from this buyer.
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSelectShipping();
            }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold text-foreground">
                Send shipping info
              </span>
              <span className="text-xs text-muted-foreground">
                Share a tracking number or carrier link for this sale.
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSelectList();
            }}
            className="relative flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Inbox className="size-4" />
              {hasGlobalPending ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-popover"
                />
              ) : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Transaction requests
                {hasGlobalPending ? (
                  <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">
                    New
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">
                Review incoming requests sent to you across all threads.
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
