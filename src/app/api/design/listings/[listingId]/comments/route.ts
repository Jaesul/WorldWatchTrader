import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { countCommentLikesByCommentIds } from '@/db/queries/comment-likes';
import { createComment, listCommentsForListing } from '@/db/queries/comments';
import { getUserById } from '@/db/queries/users';
import { listings } from '@/db/schema';
import { mapDbCommentRowToFake } from '@/lib/design/map-db-comments-to-fake';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

async function resolveViewerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value?.trim();
  if (cookieId) {
    const user = await getUserById(cookieId);
    if (user) return user.id;
  }
  const session = await auth();
  const sessionId = session?.user?.id?.trim();
  if (sessionId) {
    const user = await getUserById(sessionId);
    if (user) return user.id;
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const rows = await listCommentsForListing(listingId);
  const likeCounts = await countCommentLikesByCommentIds(rows.map((row) => row.comment.id));
  const comments = rows.map((row) =>
    mapDbCommentRowToFake(row, likeCounts[row.comment.id] ?? 0),
  );
  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;
  const viewerId = await resolveViewerId();
  if (!viewerId) {
    return NextResponse.json({ error: 'No viewer' }, { status: 401 });
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
