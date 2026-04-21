import { NextResponse } from 'next/server';

import { getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 400,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const userId = typeof body === 'object' && body !== null && 'userId' in body ? (body as { userId: unknown }).userId : null;
  if (typeof userId !== 'string' || !userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DESIGN_VIEWER_COOKIE, userId, COOKIE_OPTS);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DESIGN_VIEWER_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
