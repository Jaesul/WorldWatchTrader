import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { deleteComment } from '@/db/queries/comments';
import { listingComments } from '@/db/schema';
import { resolveApiViewer } from '@/lib/viewer/resolve-api-viewer';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string; commentId: string }> },
) {
  const { listingId, commentId } = await params;
  const viewer = await resolveApiViewer();
  if (!viewer) {
    return NextResponse.json({ error: 'No viewer' }, { status: 401 });
  }
  const viewerId = viewer.id;

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
