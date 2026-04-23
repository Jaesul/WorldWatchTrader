import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getUserById } from '@/db/queries/users';
import { DESIGN_VIEWER_COOKIE } from '@/lib/viewer/constants';

export async function requireDesignViewer() {
  const cookieStore = await cookies();
  const id = cookieStore.get(DESIGN_VIEWER_COOKIE)?.value ?? null;
  if (!id) {
    return { ok: false as const, response: NextResponse.json({ error: 'No design viewer' }, { status: 401 }) };
  }
  const user = await getUserById(id);
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Invalid design viewer' }, { status: 401 }) };
  }
  return { ok: true as const, user };
}
