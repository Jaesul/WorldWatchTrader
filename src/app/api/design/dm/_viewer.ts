import { NextResponse } from 'next/server';

import { resolveApiViewer } from '@/lib/viewer/resolve-api-viewer';

/**
 * Resolves the calling viewer for `/api/design/dm/*` routes.
 *
 * Cookie-first when called from the `/design` sandbox so QA can impersonate
 * users via the picker; session-only when called from the main routes so a
 * leftover sandbox cookie can't redirect a real user's DM writes elsewhere.
 * See `resolveApiViewer` for the surface detection logic.
 */
export async function requireDesignViewer() {
  const user = await resolveApiViewer();
  if (user) return { ok: true as const, user };
  return {
    ok: false as const,
    response: NextResponse.json({ error: 'No viewer' }, { status: 401 }),
  };
}
