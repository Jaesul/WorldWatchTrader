import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Jae’s browser-only sandbox (same idea as Nico’s /design/*, under /design/jae).
 * Iterate listings + messages with shadcn; no World tunnel required.
 */
export default function DesignJaeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        data-design-chrome
        className="border-b-2 border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40"
      >
        <div className="px-4 py-3">
          <p className="mb-3 text-xs text-sky-950 dark:text-sky-100">
            <strong>Jae — design sandbox</strong> — localhost only. Fake listings/messages OK.
            Mirror of Nico’s flow, for your surfaces. Parent bar above is Nico’s global /design nav.
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-foreground">
            <Link href="/design/jae" className="underline-offset-4 hover:underline">
              Hub
            </Link>
            <Link href="/design/jae/home" className="underline-offset-4 hover:underline">
              Home
            </Link>
            <Link href="/design/jae/listings" className="underline-offset-4 hover:underline">
              Listings
            </Link>
            <Link href="/design/jae/messages" className="underline-offset-4 hover:underline">
              Messages
            </Link>
          </nav>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-background">{children}</div>
    </>
  );
}
