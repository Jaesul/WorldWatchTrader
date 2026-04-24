"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesignNav } from "@/components/design/DesignNav";
import { SoldLuxuryCelebrationLayer } from "@/components/design/SoldLuxuryCelebrationLayer";
import { Toaster } from "@/components/ui/sonner";
export function DesignLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/design/welcome";

  if (isWelcome) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        {children}
        <SoldLuxuryCelebrationLayer />
        <Toaster position="bottom-center" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b border-border/60 bg-background px-4 py-2.5">
        <div className="mx-auto flex max-w-lg justify-center">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">
            World Watch Trader
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <DesignNav />
      <SoldLuxuryCelebrationLayer />
      <Toaster position="bottom-center" />
    </div>
  );
}
