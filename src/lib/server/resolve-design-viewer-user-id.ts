import { getDefaultDesignViewer, getDefaultDesignViewerUserId } from '@/db/queries/users';
import {
  isApiCallFromDesignSurface,
  resolveApiViewer,
  type ViewerSurface,
} from '@/lib/viewer/resolve-api-viewer';

async function resolveIsSandbox(surface: ViewerSurface): Promise<boolean> {
  if (surface === 'sandbox') return true;
  if (surface === 'main') return false;
  return isApiCallFromDesignSurface();
}

/**
 * Resolves the calling viewer's id for `/api/design/*` and other server
 * helpers that piggyback on the design viewer model.
 *
 * Order of precedence (see `resolveApiViewer` for the details):
 *  1. Sandbox surface only — `DESIGN_VIEWER_COOKIE` (sandbox impersonation).
 *  2. NextAuth session id.
 *  3. Sandbox surface only — first user by `created_at` (legacy default for
 *     fully anonymous /design hits so the picker still works without auth).
 *
 * On a main-route surface step 3 is skipped: an unauthenticated request
 * resolves to `null` so the API returns 401 instead of mutating the legacy
 * default user.
 *
 * Pass `surface='sandbox'` from `/design/layout.tsx` SSR (where `Referer`
 * points at the previous page, not the current one). API routes and server
 * actions can leave it on the default `'auto'`.
 */
export async function resolveDesignViewerUserId(
  surface: ViewerSurface = 'auto',
): Promise<string | null> {
  const user = await resolveApiViewer(surface);
  if (user) return user.id;

  if (await resolveIsSandbox(surface)) {
    return getDefaultDesignViewerUserId();
  }
  return null;
}

export async function resolveDesignViewer(surface: ViewerSurface = 'auto') {
  const user = await resolveApiViewer(surface);
  if (user) return user;

  if (await resolveIsSandbox(surface)) {
    return getDefaultDesignViewer();
  }
  return null;
}
