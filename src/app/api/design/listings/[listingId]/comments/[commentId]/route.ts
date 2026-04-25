import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { deleteComment } from '@/db/queries/comments';
import { getUserById } from '@/db/queries/users';
import { listingComments } from '@/db/schema';
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string; commentId: string }> },
) {
  const { listingId, commentId } = await params;
  const viewerId = await resolveViewerId();
  if (!viewerId) {
    return NextResponse.json({ error: 'No viewer' }, { status: 401 });
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
