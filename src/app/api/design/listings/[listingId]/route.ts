import { NextResponse } from 'next/server';

import { deleteListing, updateListing } from '@/db/queries/listings';
import type { ListingStatus } from '@/db/schema';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseListingId(raw: string): string | null {
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

const ALLOWED: ListingStatus[] = ['draft', 'active', 'pending', 'sold', 'archived'];

function isListingStatus(s: unknown): s is ListingStatus {
  return typeof s === 'string' && (ALLOWED as string[]).includes(s);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listingId: rawId } = await params;
  const listingId = parseListingId(rawId);
  if (!listingId) {
    return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body required' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Parameters<typeof updateListing>[2] = {};

  if (typeof b.title === 'string') {
    const title = b.title.trim();
    if (!title) {
      return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
    }
    patch.title = title;
  }

  if (b.priceUsd !== undefined) {
    const n = typeof b.priceUsd === 'number' ? b.priceUsd : Number(b.priceUsd);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: 'priceUsd must be a non-negative integer' }, { status: 400 });
    }
    patch.priceUsd = n;
  }

  if (typeof b.teaser === 'string') {
    patch.teaser = b.teaser;
  }

  if (typeof b.details === 'string') {
    patch.details = b.details;
  }

  if (b.condition === null || typeof b.condition === 'string') {
    patch.condition = b.condition === '' ? null : b.condition;
  }

  if (b.status !== undefined) {
    if (!isListingStatus(b.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = b.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const row = await updateListing(userId, listingId, patch);
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: row.id,
      title: row.title,
      priceUsd: row.priceUsd,
      status: row.status,
      teaser: row.teaser,
      details: row.details,
      condition: row.condition,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('forbidden') || msg.includes('not found')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    throw e;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listingId: rawId } = await params;
  const listingId = parseListingId(rawId);
  if (!listingId) {
    return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 });
  }

  try {
    await deleteListing(userId, listingId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('forbidden') || msg.includes('not found')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    throw e;
  }
}
