'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, List, MessageText, User } from 'iconoir-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

/**
 * Bottom navigation for mini apps (mobile-first).
 * https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

const paths = {
  home: '/home',
  listings: '/listings',
  messages: '/messages',
  profile: '/profile',
} as const;

type TabKey = keyof typeof paths;

function tabFromPathname(pathname: string): TabKey {
  if (pathname.startsWith('/listings')) return 'listings';
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const value = useMemo(() => tabFromPathname(pathname ?? '/home'), [pathname]);

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const key = next as TabKey;
        if (paths[key]) router.push(paths[key]);
      }}
    >
      <TabItem value="home" icon={<Home />} label="Home" />
      <TabItem value="listings" icon={<List />} label="Listings" />
      <TabItem value="messages" icon={<MessageText />} label="Messages" />
      <TabItem value="profile" icon={<User />} label="Profile" />
    </Tabs>
  );
};

/** In-page links (e.g. from stubs) so navigation matches tab routes. */
export const SpringboardLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <Link
    href={href}
    className={
      className ??
      'text-sm font-medium text-neutral-700 underline underline-offset-2'
    }
  >
    {children}
  </Link>
);
