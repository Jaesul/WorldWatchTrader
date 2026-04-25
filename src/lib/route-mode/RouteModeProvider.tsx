'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Tiny client context the shared design clients use to know which app surface
 * they are rendering inside (the cookie-picker `/design` sandbox vs the
 * NextAuth-gated base routes). Lets us reuse one set of components for both
 * surfaces and just thread the right link prefix / sandbox-only UI flag down.
 */
export type RouteMode = {
  basePath: '' | '/design';
  isSandbox: boolean;
};

const DEFAULT_MODE: RouteMode = {
  basePath: '/design',
  isSandbox: true,
};

const RouteModeContext = createContext<RouteMode>(DEFAULT_MODE);

export function RouteModeProvider({
  basePath,
  isSandbox,
  children,
}: {
  basePath: '' | '/design';
  isSandbox: boolean;
  children: ReactNode;
}) {
  const value = useMemo<RouteMode>(() => ({ basePath, isSandbox }), [basePath, isSandbox]);
  return <RouteModeContext.Provider value={value}>{children}</RouteModeContext.Provider>;
}

export function useRouteMode(): RouteMode {
  return useContext(RouteModeContext);
}
