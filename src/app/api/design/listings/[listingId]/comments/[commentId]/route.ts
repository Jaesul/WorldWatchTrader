import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { deleteComment } from '@/db/queries/comments';
import { getUserById } from '@/db/queries/users';
import { listingComments } from '@/db/schema';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string; commentId: string }> },
) {
  const { listingId, commentId } = await params;
  const cookieStore = await cookies();
  const viewerId = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value ?? null;
  if (!viewerId) {
    return NextResponse.json({ error: 'No design viewer' }, { status: 401 });
  }
  const viewerRow = await getUserById(viewerId);
  if (!viewerRow) {
    return NextResponse.json({ error: 'Invalid design viewer' }, { status: 401 });
  }

  const db = getDb();
  const [row] = await db
    .select({ listingId: listingComments.listingId })
    .from(listingComments)
    .where(eq(listingComments.id, commentId))
    .limit(1);
  if (!row || row.listingId !== listingId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const deleted = await deleteComment(viewerId, commentId);
  if (!deleted) {
    return NextResponse.json({ error: 'Forbidden or already deleted' }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
