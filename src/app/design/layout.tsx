import type { ReactNode } from 'react';
import { DesignNav } from '@/components/design/DesignNav';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="shrink-0 bg-amber-50 px-4 py-1.5 dark:bg-amber-950/30">
        <p className="text-[11px] text-amber-950 dark:text-amber-100">
          <strong>Design sandbox</strong> — localhost only, no auth or World App needed.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <DesignNav />
    </div>
  );
}
