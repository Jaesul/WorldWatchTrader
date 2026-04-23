import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getOrCreateThread } from '@/db/queries/dm-threads';

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const listingId =
    typeof bodyJson === 'object' &&
    bodyJson !== null &&
    'listingId' in bodyJson &&
    typeof (bodyJson as { listingId: unknown }).listingId === 'string'
      ? (bodyJson as { listingId: string }).listingId
      : null;

  if (!listingId?.trim()) {
    return NextResponse.json({ error: 'listingId required' }, { status: 400 });
  }

  const created = await getOrCreateThread(userId, listingId.trim());
  if (!created.ok) {
    const status = created.error === 'listing_not_found' ? 404 : 400;
    return NextResponse.json({ error: created.error }, { status });
  }

  return NextResponse.json({ threadId: created.thread.id });
}
