'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePlus,
  Bookmark,
  House,
  MessageCircle,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const tabs = [
  {
    key: 'feed',
    href: '/design',
    icon: (active: boolean) => (
      <House fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
  {
    key: 'messages',
    href: '/design/messages',
    icon: (active: boolean) => (
      <MessageCircle fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
  {
    key: 'new-listing',
    href: '/design/post',
    icon: () => <BadgePlus strokeWidth={1.8} className="size-6" />,
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
      <User fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.2 : 1.8} className="size-6" />
    ),
  },
];

export function DesignNav() {
  const pathname = usePathname();

  function isActive(key: string) {
    if (key === 'feed') return pathname === '/design';
    if (key === 'messages') return pathname.startsWith('/design/messages');
    if (key === 'new-listing') return pathname.startsWith('/design/post');
    if (key === 'saved') return pathname === '/design/saved';
    if (key === 'profile') return pathname === '/design/profile' || pathname.startsWith('/design/profile/') || pathname.startsWith('/design/u/');
    return false;
  }

  return (
    <nav className="sticky bottom-0 z-30 flex items-center border-t border-border bg-card px-2">
      {tabs.map((tab, index) => {
        const active = isActive(tab.key);
        const isNewListing = tab.key === 'new-listing';
        const baseClass = cn(
          'flex min-h-14 flex-1 items-center justify-center py-3 transition-colors hover:text-foreground',
          active
            ? isNewListing
              ? 'text-primary'
              : 'text-foreground'
            : 'text-muted-foreground',
        );

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
  );
}
