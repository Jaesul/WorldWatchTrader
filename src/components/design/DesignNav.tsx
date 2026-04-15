'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    key: 'feed',
    label: 'Feed',
    href: '/design',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor" className="size-6">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'messages',
    label: 'Messages',
    href: '/design/messages',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor" className="size-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'post',
    label: '',
    href: '/design/post',
    icon: (_active: boolean) => (
      <span className="flex items-center justify-center size-12 rounded-full bg-foreground text-background shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.4} stroke="currentColor" className="size-6">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    ),
  },
  {
    key: 'saved',
    label: 'Saved',
    href: '/design/saved',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.2 : 1.8} stroke="currentColor" className="size-6">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/design/profile',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2.2 : 1.8} stroke="currentColor" className="size-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export function DesignNav() {
  const pathname = usePathname();

  function isActive(key: string) {
    if (key === 'feed') return pathname === '/design';
    if (key === 'messages') return pathname.startsWith('/design/messages');
    if (key === 'post') return pathname === '/design/post';
    if (key === 'saved') return pathname === '/design/saved';
    if (key === 'profile') return pathname === '/design/profile';
    return false;
  }

  return (
    <nav className="sticky bottom-0 z-30 flex items-end justify-around border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom,0px)]" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        const isCenter = tab.key === 'post';
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-2 ${isCenter ? '-mt-5' : ''} ${active ? 'text-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground`}
          >
            {tab.icon(active)}
            {tab.label ? (
              <span className={`text-[10px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
