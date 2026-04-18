'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, List, MessageText, User } from 'iconoir-react';
import { BadgePlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

import { navUsesBlueEnergy } from '@/lib/nav-blue-energy';
import { cn } from '@/lib/utils';

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

const tabBlueEnergyClass =
  'text-white/55 hover:text-white/80 data-[state=on]:text-white [&_span]:text-inherit';

export const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const value = useMemo(() => tabFromPathname(pathname ?? '/home'), [pathname]);
  const blueEnergy = navUsesBlueEnergy(pathname);
  const onNewListing = pathname?.startsWith('/listings/new') ?? false;

  return (
    <div
      className={cn(
        'w-full border-t transition-colors duration-300',
        blueEnergy ? 'border-white/15 bg-blue-energy' : 'border-border bg-card',
      )}
    >
      <Tabs
        value={value}
        onValueChange={(next) => {
          const key = next as TabKey;
          if (paths[key]) router.push(paths[key]);
        }}
      >
        <TabItem
          value="home"
          icon={<Home />}
          label="Home"
          className={blueEnergy ? tabBlueEnergyClass : undefined}
        />
        <TabItem
          value="listings"
          icon={<List />}
          label="Listings"
          className={blueEnergy ? tabBlueEnergyClass : undefined}
        />
        <TabItem
          value="new-listing"
          icon={<BadgePlus strokeWidth={1.8} />}
          label="New"
          className={cn(
            blueEnergy
              ? tabBlueEnergyClass
              : onNewListing
                ? 'text-primary data-[state=on]:text-primary [&_span]:text-primary'
                : undefined,
          )}
          onClick={() => router.push('/listings/new')}
        />
        <TabItem
          value="messages"
          icon={<MessageText />}
          label="Messages"
          className={blueEnergy ? tabBlueEnergyClass : undefined}
        />
        <TabItem
          value="profile"
          icon={<User />}
          label="Profile"
          className={blueEnergy ? tabBlueEnergyClass : undefined}
        />
      </Tabs>
    </div>
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
