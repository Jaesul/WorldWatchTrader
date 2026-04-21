import { NextResponse } from 'next/server';

import { getListingById } from '@/db/queries/listings';
import { likeListing, listLikedListingIds, unlikeListing } from '@/db/queries/likes';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseListingId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

export async function GET() {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ listingIds: [] });
  }
  const listingIds = await listLikedListingIds(userId);
  return NextResponse.json({ listingIds });
}

export async function POST(request: Request) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'No design viewer' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const listingId = parseListingId(
    typeof body === 'object' && body !== null && 'listingId' in body
      ? (body as { listingId: unknown }).listingId
      : null,
  );
  if (!listingId) {
    return NextResponse.json({ error: 'listingId must be a UUID' }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  await likeListing(userId, listingId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'No design viewer' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = parseListingId(searchParams.get('listingId'));
  if (!listingId) {
    return NextResponse.json({ error: 'listingId query must be a UUID' }, { status: 400 });
  }

  await unlikeListing(userId, listingId);
  return NextResponse.json({ ok: true });
}
