import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { getOrCreateThread } from '@/db/queries/dm-threads';

export async function POST(request: Request) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

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

  const created = await getOrCreateThread(v.user.id, listingId.trim());
  if (!created.ok) {
    const status = created.error === 'listing_not_found' ? 404 : 400;
    return NextResponse.json({ error: created.error }, { status });
  }

  return NextResponse.json({ threadId: created.thread.id });
}
