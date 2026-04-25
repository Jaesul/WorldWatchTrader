import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

/**
 * Resolves the calling viewer for /api/design/* routes.
 *
 * Cookie-first preserves the /design sandbox impersonation picker. If no cookie
 * is set (i.e. requests originating from the base, NextAuth-gated routes), we
 * fall back to the authenticated session so the same API surface serves both.
 */
export async function requireDesignViewer() {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
  if (cookieId) {
    const user = await getUserById(cookieId);
    if (user) return { ok: true as const, user };
  }

  const session = await auth();
  const sessionId = session?.user?.id?.trim() ?? '';
  if (sessionId) {
    const user = await getUserById(sessionId);
    if (user) return { ok: true as const, user };
  }

  return {
    ok: false as const,
    response: NextResponse.json({ error: 'No viewer' }, { status: 401 }),
  };
}
