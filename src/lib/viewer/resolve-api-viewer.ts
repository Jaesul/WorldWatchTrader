import { cookies, headers } from 'next/headers';

import { auth } from '@/auth';
import { getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

/**
 * Which UI surface a request originated from. Server components inside
 * `/design/*` know they're sandboxed at compile time — they should pass
 * `'sandbox'` explicitly. API routes and server actions can't tell, so they
 * use `'auto'` and we sniff the `Referer` header.
 */
export type ViewerSurface = 'sandbox' | 'main' | 'auto';

/**
 * Whether an `/api/design/*` request originated from a `/design/*` sandbox
 * page. We sniff the `Referer` header rather than baking surface info into
 * each fetch so the existing client code keeps working unchanged.
 *
 * Falls back to `false` (treat as main route, session-only) when `Referer`
 * is missing or unparseable. That's the safer default — we'd rather refuse
 * to impersonate via the picker than accidentally redirect a main-route
 * write to the wrong user.
 */
export async function isApiCallFromDesignSurface(): Promise<boolean> {
  const reqHeaders = await headers();
  const referer = reqHeaders.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).pathname.startsWith('/design');
  } catch {
    return false;
  }
}

async function resolveSurface(surface: ViewerSurface): Promise<'sandbox' | 'main'> {
  if (surface === 'sandbox' || surface === 'main') return surface;
  return (await isApiCallFromDesignSurface()) ? 'sandbox' : 'main';
}

/**
 * Resolves the calling viewer for `/api/design/*` requests.
 *
 *  - sandbox surface: cookie picker beats session so QA can impersonate seeded users.
 *  - main surface: session only — the cookie is ignored so leftover sandbox
 *    impersonation can't bleed into real-user writes.
 *
 * Returns `null` when no viewer can be determined.
 */
export async function resolveApiViewer(surface: ViewerSurface = 'auto') {
  const resolved = await resolveSurface(surface);

  if (resolved === 'sandbox') {
    const cookieStore = await cookies();
    const cookieId = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
    if (cookieId) {
      const user = await getUserById(cookieId);
      if (user) return user;
    }
  }

  const session = await auth();
  const sessionId = session?.user?.id?.trim() ?? '';
  if (sessionId) {
    const user = await getUserById(sessionId);
    if (user) return user;
  }

  return null;
}
