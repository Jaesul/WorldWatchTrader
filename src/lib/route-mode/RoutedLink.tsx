'use client';

import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { useRouteMode } from '@/lib/route-mode/RouteModeProvider';

type RoutedLinkProps = Omit<LinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'href'> & {
    /** Path relative to the current route surface. Should start with `/`. */
    to: string;
    children?: ReactNode;
  };

/**
 * Like `next/link` but prefixes the href with the active route mode's basePath.
 * Use inside server components by treating it as a regular client component.
 *
 * Example: `<RoutedLink to="/messages">Inbox</RoutedLink>` ->
 *   `/messages` on base routes, `/design/messages` inside the sandbox.
 */
export function RoutedLink({ to, children, ...rest }: RoutedLinkProps) {
  const { basePath } = useRouteMode();
  const href = to === '/' ? basePath || '/' : `${basePath}${to}`;
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
