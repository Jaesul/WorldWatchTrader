import { cookies } from 'next/headers';

import { getDefaultDesignViewer, getDefaultDesignViewerUserId, getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

/**
 * Resolves the design sandbox viewer id from cookie, else first user by `created_at`.
 * Uses cheap lookups only so hot routes (`/api/design/listing-saves`, etc.) do not run
 * `listUsersForPicker` (which was piling up behind `postgres({ max: 1 })` and timing out).
 */
export async function resolveDesignViewerUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
  if (raw) {
    const user = await getUserById(raw);
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
  return getDefaultDesignViewer();
}
