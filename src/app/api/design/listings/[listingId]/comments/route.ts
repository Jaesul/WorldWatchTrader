import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { createComment } from '@/db/queries/comments';
import { getUserById } from '@/db/queries/users';
import { listings } from '@/db/schema';
import { mapDbCommentRowToFake } from '@/lib/design/map-db-comments-to-fake';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const cookieStore = await cookies();
  const viewerId = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value ?? null;
  if (!viewerId) {
    return NextResponse.json({ error: 'No design viewer' }, { status: 401 });
  }
  const viewerRow = await getUserById(viewerId);
  if (!viewerRow) {
    return NextResponse.json({ error: 'Invalid design viewer' }, { status: 401 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const body =
    typeof bodyJson === 'object' &&
    bodyJson !== null &&
    'body' in bodyJson &&
    typeof (bodyJson as { body: unknown }).body === 'string'
      ? (bodyJson as { body: string }).body
      : null;
  if (!body?.trim()) {
    return NextResponse.json({ error: 'body required' }, { status: 400 });
  }

  const db = getDb();
  const [listing] = await db
    .select({ id: listings.id, status: listings.status })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  try {
    const row = await createComment(viewerId, listingId, body);
    if (!row) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
    const author = await getUserById(row.authorId);
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 500 });
    }
    const comment = mapDbCommentRowToFake({ comment: row, author });
    return NextResponse.json({ comment });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
