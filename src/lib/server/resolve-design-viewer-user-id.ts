import { cookies } from 'next/headers';

import { auth } from '@/auth';
import { getDefaultDesignViewer, getDefaultDesignViewerUserId, getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

/**
 * Resolves the calling viewer's id.
 *
 * Order of precedence:
 *  1. `DESIGN_VIEWER_COOKIE` (the /design sandbox picker — lets QA impersonate users).
 *  2. NextAuth session id — used when the request originates from a base route.
 *  3. First user by `created_at` (legacy default for unauth /design hits).
 *
 * Uses cheap PK lookups only so hot routes (`/api/design/listing-saves`, etc.) do not
 * run `listUsersForPicker` (which was piling up behind `postgres({ max: 1 })`).
 */
export async function resolveDesignViewerUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
  if (raw) {
    const user = await getUserById(raw);
    if (user) return user.id;
  }

  const session = await auth();
  const sessionId = session?.user?.id?.trim() ?? '';
  if (sessionId) {
    const user = await getUserById(sessionId);
    if (user) return user.id;
  }

  return getDefaultDesignViewerUserId();
}

export async function resolveDesignViewer() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
  if (raw) {
    const user = await getUserById(raw);
    if (user) return user;
  }

  const session = await auth();
  const sessionId = session?.user?.id?.trim() ?? '';
  if (sessionId) {
    const user = await getUserById(sessionId);
    if (user) return user;
  }

  return getDefaultDesignViewer();
}
