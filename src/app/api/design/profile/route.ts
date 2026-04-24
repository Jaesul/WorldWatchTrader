import { NextResponse } from 'next/server';

import { getUserById, updateUserProfile, type PatchUserInput } from '@/db/queries/users';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';

const MAX_BIO_LENGTH = 500;

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const row = await getUserById(userId);
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(dbUserRowToAppViewer(row));
}

export async function PATCH(request: Request) {
  const userId = await resolveDesignViewerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body required' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: PatchUserInput = {};

  if (b.bio !== undefined) {
    if (typeof b.bio !== 'string') {
      return NextResponse.json({ error: 'bio must be a string' }, { status: 400 });
    }
    patch.bio = b.bio.slice(0, MAX_BIO_LENGTH);
  }

  if (b.profilePictureUrl !== undefined) {
    if (b.profilePictureUrl === null || b.profilePictureUrl === '') {
      patch.profilePictureUrl = null;
    } else if (typeof b.profilePictureUrl === 'string' && isHttpUrl(b.profilePictureUrl)) {
      patch.profilePictureUrl = b.profilePictureUrl;
    } else {
      return NextResponse.json(
        { error: 'profilePictureUrl must be http(s) URL or null' },
        { status: 400 },
      );
    }
  }

  if (b.username !== undefined) {
    if (typeof b.username !== 'string') {
      return NextResponse.json({ error: 'username must be a string' }, { status: 400 });
    }
    const trimmed = b.username.trim();
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'username cannot be empty' }, { status: 400 });
    }
    patch.username = trimmed.slice(0, 80);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const row = await updateUserProfile(userId, patch);
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(dbUserRowToAppViewer(row));
}
