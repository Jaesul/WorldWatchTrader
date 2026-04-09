import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="z-20 border-b border-border bg-card px-4 py-3">
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>Design preview</strong> — runs on normal localhost. No World App, ngrok, or
          tunnel needed. Fake data is OK.
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-foreground">
          <Link href="/design" className="underline-offset-4 hover:underline">
            Landing
          </Link>
          <Link href="/design/home" className="underline-offset-4 hover:underline">
            Home
          </Link>
          <Link href="/design/profile" className="underline-offset-4 hover:underline">
            Profile
          </Link>
          <Link
            href="/design/u/demo-seller"
            className="underline-offset-4 hover:underline"
          >
            Other profile (demo)
          </Link>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
