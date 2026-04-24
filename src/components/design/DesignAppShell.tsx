"use client";

import type { ReactNode } from "react";
import { ArrowLeftRight, Watch } from "lucide-react";

import { DesignNav } from "@/components/design/DesignNav";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import { SoldLuxuryCelebrationLayer } from "@/components/design/SoldLuxuryCelebrationLayer";
import { Toaster } from "@/components/ui/sonner";

/**
 * Design route shell: compact brand row, scroll root for page content,
 * bottom nav and toasts.
 */
export function DesignAppShell({ children }: { children: ReactNode }) {
  return (
    <div data-design-app className="flex h-dvh flex-col bg-background">
      <div className="flex min-w-0 shrink-0 items-center gap-3 bg-background px-3 py-4">
        <header className="flex min-w-0 shrink-0 items-center gap-2">
          <span
            className="flex shrink-0 items-center gap-1.5 text-foreground/75"
            aria-hidden
          >
            <WorldOrbIcon className="size-5" />
            <Watch className="size-5" strokeWidth={2} />
            <ArrowLeftRight className="size-5" strokeWidth={2} />
          </span>
          <h1 className="shrink-0 whitespace-nowrap text-2xl font-semibold tracking-tight text-foreground">
            World Watch Trader
          </h1>
        </header>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-design-scroll-root
      >
        {children}
      </div>
      <DesignNav />
      <SoldLuxuryCelebrationLayer />
      <Toaster position="bottom-center" />
    </div>
  );
}
