import type { SellerListingCursor } from '@/db/queries/listings';
import type { ViewerDashboardCursorJson } from '@/lib/viewer/dashboard';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const b64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function encodeSellerListingCursor(c: ViewerDashboardCursorJson): string {
  const json = JSON.stringify({ updatedAt: c.updatedAt, id: c.id });
  return base64UrlEncode(new TextEncoder().encode(json));
}

export function decodeSellerListingCursor(raw: string | null): SellerListingCursor | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const json = new TextDecoder().decode(base64UrlDecode(raw.trim()));
    const j = JSON.parse(json) as { updatedAt?: string; id?: string };
    if (typeof j.updatedAt !== 'string' || typeof j.id !== 'string') return undefined;
    const updatedAt = new Date(j.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) return undefined;
    return { updatedAt, id: j.id };
  } catch {
    return undefined;
  }
}

export function sellerCursorToJson(
  c: SellerListingCursor | undefined,
): ViewerDashboardCursorJson | null {
  if (!c) return null;
  return { updatedAt: c.updatedAt.toISOString(), id: c.id };
}
