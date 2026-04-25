import { getDefaultDesignViewerUserId, getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const f = createUploadthing();

/** Verbose UploadThing logs: `UPLOADTHING_DEBUG=1`, or any value except `0` in development. */
function uploadthingDebugEnabled(): boolean {
  const v = process.env.UPLOADTHING_DEBUG;
  if (v === '0') return false;
  if (v === '1' || v === 'true') return true;
  if (v && v !== '0') return true;
  return process.env.NODE_ENV === 'development';
}

function utLog(...args: unknown[]) {
  if (!uploadthingDebugEnabled()) return;
  console.log('[uploadthing:listingImages]', ...args);
}

function utErr(...args: unknown[]) {
  console.error('[uploadthing:listingImages]', ...args);
}

/** True when the browser likely sent `__Secure-authjs.session-token` (HTTPS / proxied HTTPS). */
function inferSecureSessionCookie(req: NextRequest): boolean {
  const forwarded = req.headers.get('x-forwarded-proto');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() === 'https';
  }
  return req.nextUrl.protocol === 'https:';
}

/**
 * Session user id without `auth()` / `cookies()` from `next/headers` (UploadThing
 * runs outside the usual Next.js auth context).
 *
 * Auth.js v5 uses `authjs.session-token` on http (e.g. localhost) and
 * `__Secure-authjs.session-token` on https. `getToken` defaults to the http
 * cookie name, so Mini App / ngrok / production uploads would miss the JWT
 * unless we pass `secureCookie` correctly — and we still try both if the
 * forwarded-proto guess is wrong.
 */
async function sessionUserIdFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!secret) {
      utLog('session: skip (no AUTH_SECRET / NEXTAUTH_SECRET)');
      return null;
    }

    const preferSecure = inferSecureSessionCookie(req);
    const order = preferSecure ? [true, false] : [false, true];

    for (const secureCookie of order) {
      const token = await getToken({ req, secret, secureCookie });
      if (!token) continue;
      const fromJwt =
        (typeof token.userId === 'string' && token.userId) ||
        (typeof token.sub === 'string' && token.sub) ||
        null;
      if (fromJwt && fromJwt.length > 0) {
        utLog('session: decoded JWT', {
          secureCookie,
          hasUserId: !!token.userId,
          hasSub: !!token.sub,
        });
        return fromJwt;
      }
    }

    utLog('session: getToken returned null (tried secure + non-secure cookie names)');
    return null;
  } catch (e) {
    utErr('session: getToken threw', e);
    return null;
  }
}

/**
 * Whether the upload was kicked off from a `/design/*` page. Used to decide
 * whether the design picker cookie should beat the session — we never want a
 * leftover sandbox cookie to redirect a real-user upload to the wrong row.
 */
function isUploadFromDesignSurface(req: NextRequest): boolean {
  const referer = req.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).pathname.startsWith('/design');
  } catch {
    return false;
  }
}

async function resolveUploaderUserId(req: NextRequest): Promise<string> {
  try {
    const fromDesign = isUploadFromDesignSurface(req);
    utLog('upload surface', { fromDesign });

    if (fromDesign) {
      const raw = req.cookies.get(DESIGN_VIEWER_COOKIE)?.value?.trim() ?? '';
      utLog('design viewer cookie', {
        name: DESIGN_VIEWER_COOKIE,
        present: Boolean(raw),
        length: raw.length,
      });
      if (raw) {
        try {
          const user = await getUserById(raw);
          if (user) {
            utLog('middleware resolved userId from design cookie');
            return user.id;
          }
          utLog('design cookie value did not match a user row');
        } catch (e) {
          utErr('getUserById(design cookie) threw', e);
          throw e;
        }
      }
    }

    const sessionUserId = await sessionUserIdFromRequest(req);
    if (sessionUserId) {
      utLog('middleware resolved userId from session JWT');
      return sessionUserId;
    }

    if (fromDesign) {
      let fallbackId: string | null = null;
      try {
        fallbackId = await getDefaultDesignViewerUserId();
      } catch (e) {
        utErr('getDefaultDesignViewerUserId threw', e);
        throw e;
      }
      if (fallbackId) {
        utLog('middleware resolved userId from DB default viewer');
        return fallbackId;
      }
    }

    utErr('middleware: no session, invalid design cookie, and no default user — Unauthorized');
    throw new UploadThingError('Unauthorized');
  } catch (e) {
    if (e instanceof UploadThingError) {
      utErr('middleware exiting with UploadThingError', e.message, (e as Error).cause);
      throw e;
    }
    utErr('middleware FAILED (unexpected)', e);
    throw e;
  }
}

export const ourFileRouter = {
  listingImages: f({
    image: {
      maxFileSize: '16MB',
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => {
      utLog('middleware enter (listingImages)', {
        pathname: req.nextUrl?.pathname,
        search: req.nextUrl?.search,
        hasUploadthingToken: Boolean(process.env.UPLOADTHING_TOKEN),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      });
      const userId = await resolveUploaderUserId(req);
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      utLog('onUploadComplete (listingImages)', {
        userId: metadata.userId,
        ufsUrlHost: safeHost(file.ufsUrl),
      });
      return { uploadedBy: metadata.userId, ufsUrl: file.ufsUrl };
    }),
  /**
   * Single avatar upload for the profile edit flow. The CRUD write to
   * `users.profile_picture_url` happens via `/api/design/profile` after the
   * client receives the URL, so this route only needs to return `ufsUrl`.
   */
  profileAvatar: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      utLog('middleware enter (profileAvatar)', {
        pathname: req.nextUrl?.pathname,
      });
      const userId = await resolveUploaderUserId(req);
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      utLog('onUploadComplete (profileAvatar)', {
        userId: metadata.userId,
        ufsUrlHost: safeHost(file.ufsUrl),
      });
      return { uploadedBy: metadata.userId, ufsUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

function safeHost(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return '(invalid url)';
  }
}

export type OurFileRouter = typeof ourFileRouter;
