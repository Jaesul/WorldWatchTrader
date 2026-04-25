'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgePlus,
  Bookmark,
  House,
  MessageCircle,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDesignViewer } from '@/lib/design/DesignViewerProvider';
import { blockDesignInteractionWithoutWorldId } from '@/lib/design/world-id-interaction-gate';
import { useRouteMode } from '@/lib/route-mode/RouteModeProvider';

const ACTIVE_NAV_CLASS = 'text-[#ffc85c]';

type TabKey = 'feed' | 'messages' | 'new-listing' | 'saved' | 'profile';

function buildTabs(basePath: '' | '/design') {
  const feedHref = basePath || '/';
  return [
    {
      key: 'feed' as TabKey,
      href: feedHref,
      icon: (active: boolean) => (
        <House fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 1.75} className="size-[22px]" />
      ),
    },
    {
      key: 'messages' as TabKey,
      href: `${basePath}/messages`,
      icon: (active: boolean) => (
        <MessageCircle fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 1.75} className="size-[22px]" />
      ),
    },
    {
      key: 'new-listing' as TabKey,
      href: `${basePath}/post`,
      icon: () => <BadgePlus strokeWidth={1.75} className="size-[22px]" />,
    },
    {
      key: 'saved' as TabKey,
      href: `${basePath}/saved`,
      icon: (active: boolean) => (
        <Bookmark
          fill={active ? 'currentColor' : 'none'}
          strokeWidth={active ? 2 : 1.75}
          className="size-[22px]"
        />
      ),
    },
    {
      key: 'profile' as TabKey,
      href: `${basePath}/profile`,
      icon: (active: boolean) => (
        <User fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2 : 1.75} className="size-[22px]" />
      ),
    },
  ];
}

export function DesignNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { viewer } = useDesignViewer();
  const { basePath } = useRouteMode();
  const orbGate = { viewerOrbVerified: viewer?.orbVerified === true };

  const tabs = buildTabs(basePath);
  const feedRoot = basePath || '/';

  function isActive(key: TabKey) {
    if (key === 'feed') return pathname === feedRoot;
    if (key === 'messages') return pathname.startsWith(`${basePath}/messages`);
    if (key === 'new-listing') return pathname.startsWith(`${basePath}/post`);
    if (key === 'saved') return pathname === `${basePath}/saved`;
    if (key === 'profile') {
      return (
        pathname === `${basePath}/profile` ||
        pathname.startsWith(`${basePath}/profile/`) ||
        pathname.startsWith(`${basePath}/u/`)
      );
    }
    return false;
  }

  return (
    <nav className="sticky bottom-0 z-30 flex items-center border-t border-border bg-card px-2 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2">
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        const isNewListing = tab.key === 'new-listing';
        const baseClass = cn(
          'flex min-h-14 flex-1 items-center justify-center py-2 transition-colors hover:text-foreground',
          active ? ACTIVE_NAV_CLASS : 'text-muted-foreground',
        );

        return (
          <div key={tab.key} className="flex flex-1 items-center">
            {isNewListing ? (
              <button
                type="button"
                className={baseClass}
                aria-label={tab.key}
                onClick={() => {
                  if (blockDesignInteractionWithoutWorldId(orbGate)) return;
                  router.push(tab.href);
                }}
              >
                {tab.icon(active)}
              </button>
            ) : (
              <Link href={tab.href} className={baseClass} aria-label={tab.key}>
                {tab.icon(active)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
