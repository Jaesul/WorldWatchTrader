import type { ReactNode } from 'react';
import { DesignNav } from '@/components/design/DesignNav';
import { SoldLuxuryCelebrationLayer } from '@/components/design/SoldLuxuryCelebrationLayer';
import { Toaster } from '@/components/ui/sonner';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight">World Watch Trader</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <DesignNav />
      <SoldLuxuryCelebrationLayer />
      <Toaster position="bottom-center" />
    </div>
  );
}
