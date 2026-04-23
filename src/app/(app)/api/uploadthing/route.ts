import { loadEnvConfig } from '@next/env';
import { createRouteHandler } from 'uploadthing/next';
import type { NextRequest } from 'next/server';

import { ourFileRouter } from './core';

// Ensure `.env.local` is merged into `process.env` before we read the token (matches Next bootstrap ordering).
loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development');

/**
 * Read token in app code (not only inside `node_modules/uploadthing`).
 * Pass `config.token` into `createRouteHandler` so UploadThing does not rely only on Effect `fromEnv()`.
 */
function normalizeUploadthingToken(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string') return undefined;
  let v = raw.trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1).trim();
  }
  return v.length > 0 ? v : undefined;
}

const uploadthingToken = normalizeUploadthingToken(process.env.UPLOADTHING_TOKEN);

if (!uploadthingToken && process.env.NODE_ENV === 'development') {
  console.error(
    '[uploadthing] UPLOADTHING_TOKEN is missing or blank in process.env. Use repo-root `.env.local`, no wrapping quotes around the value, then restart `next dev`.',
  );
}

const { GET: innerGET, POST: innerPOST } = createRouteHandler({
  router: ourFileRouter,
  ...(uploadthingToken ? { config: { token: uploadthingToken } } : {}),
});

function uploadthingRouteDebugEnabled(): boolean {
  const v = process.env.UPLOADTHING_DEBUG;
  if (v === '0') return false;
  if (v === '1' || v === 'true') return true;
  if (v && v !== '0') return true;
  return process.env.NODE_ENV === 'development';
}

async function logResponse(name: string, req: NextRequest, res: Response): Promise<Response> {
  if (!uploadthingRouteDebugEnabled()) return res;
  if (res.ok) {
    console.log(`[uploadthing route] ${name}`, res.status, req.nextUrl?.search ?? '');
    return res;
  }
  let body = '';
  try {
    body = (await res.clone().text()).slice(0, 4000);
  } catch {
    body = '(could not read body)';
  }
  console.error(`[uploadthing route] ${name} non-OK`, {
    status: res.status,
    statusText: res.statusText,
    search: req.nextUrl?.search,
    bodyPreview: body,
  });
  return res;
}

function wrap(name: string, handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const res = await handler(req);
      return logResponse(name, req, res);
    } catch (e) {
      console.error(`[uploadthing route] ${name} handler threw`, e);
      throw e;
    }
  };
}

export const GET = wrap('GET', innerGET);
export const POST = wrap('POST', innerPOST);
