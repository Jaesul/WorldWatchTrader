'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  FlaskConical,
  MessageSquare,
  Newspaper,
  ShieldUser,
} from 'lucide-react';

const tabs = [
  {
    key: 'feed',
    href: '/design',
    icon: (active: boolean) => (
      <Newspaper strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
  {
    key: 'messages',
    href: '/design/messages',
    icon: (active: boolean) => (
      <MessageSquare strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
  {
    key: 'saved',
    href: '/design/saved',
    icon: (active: boolean) => (
      <Bookmark
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 2.2 : 1.8}
        className="size-6"
      />
    ),
  },
  {
    key: 'profile',
    href: '/design/profile',
    icon: (active: boolean) => (
      <ShieldUser strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
  {
    key: 'design-menu',
    href: '#',
    icon: (active: boolean) => (
      <FlaskConical strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
];

export function DesignNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(key: string) {
    if (key === 'feed') return pathname === '/design';
    if (key === 'messages') return pathname.startsWith('/design/messages');
    if (key === 'saved') return pathname === '/design/saved';
    if (key === 'profile') return pathname === '/design/profile';
    if (key === 'design-menu') return menuOpen;
    return false;
  }

  return (
    <>
      <nav className="sticky bottom-0 z-30 flex items-center border-t border-border bg-card px-2">
        {tabs.map((tab, index) => {
          const active = isActive(tab.key);
          const baseClass = `flex min-h-14 flex-1 items-center justify-center py-3 ${active ? 'text-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground`;

          if (tab.key === 'design-menu') {
            return (
              <div key={tab.key} className="flex flex-1 items-center">
                {index > 0 ? <div aria-hidden className="h-6 w-px bg-border" /> : null}
                <button
                  type="button"
                  className={baseClass}
                  aria-label="testing routes"
                  onClick={() => setMenuOpen(true)}
                >
                  {tab.icon(active)}
                </button>
              </div>
            );
          }

          return (
            <div key={tab.key} className="flex flex-1 items-center">
              {index > 0 ? <div aria-hidden className="h-6 w-px bg-border" /> : null}
              <Link href={tab.href} className={baseClass} aria-label={tab.key}>
                {tab.icon(active)}
              </Link>
            </div>
          );
        })}
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close design menu overlay"
            className="absolute inset-0"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Design navigation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Localhost-only design links and sandbox routes.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
              <strong>Design preview</strong> — runs on normal localhost. No World App, ngrok, or
              tunnel needed. Fake data is OK.
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Global design routes
              </p>
              <Link
                href="/design"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Landing
              </Link>
              <Link
                href="/design/home"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Home
              </Link>
              <Link
                href="/design/profile"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Profile
              </Link>
              <Link
                href="/design/u/demo-seller"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Other profile (demo)
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Jae sandbox
              </p>
              <Link
                href="/design/jae"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Hub
              </Link>
              <Link
                href="/design/jae/home"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Home
              </Link>
              <Link
                href="/design/jae/listings"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Listings
              </Link>
              <Link
                href="/design/jae/messages"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Messages
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
