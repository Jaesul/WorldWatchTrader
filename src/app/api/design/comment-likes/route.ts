import { NextResponse } from 'next/server';

import {
  getActiveCommentById,
  likeComment,
  listLikedCommentIdsForUser,
  unlikeComment,
} from '@/db/queries/comment-likes';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCommentId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

export async function GET() {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ commentIds: [] });
  }
  const commentIds = await listLikedCommentIdsForUser(userId);
  return NextResponse.json({ commentIds });
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

  const commentId = parseCommentId(
    typeof body === 'object' && body !== null && 'commentId' in body
      ? (body as { commentId: unknown }).commentId
      : null,
  );
  if (!commentId) {
    return NextResponse.json({ error: 'commentId must be a UUID' }, { status: 400 });
  }

  const comment = await getActiveCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  await likeComment(userId, commentId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'No design viewer' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = parseCommentId(searchParams.get('commentId'));
  if (!commentId) {
    return NextResponse.json({ error: 'commentId query must be a UUID' }, { status: 400 });
  }

  await unlikeComment(userId, commentId);
  return NextResponse.json({ ok: true });
}
