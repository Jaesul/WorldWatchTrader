import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { isUuid } from '@/lib/design/is-uuid';
import {
  assertThreadParticipant,
  buildListingSnapshot,
  getThreadById,
  insertMessage,
  listMessages,
  messageToApi,
} from '@/db/queries/dm-threads';
import { getDb } from '@/db';
import { listings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { threadId } = await params;
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }
  const ok = await assertThreadParticipant(threadId, v.user.id);
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await listMessages(threadId, { limit: 200 });
  return NextResponse.json({
    messages: messages.map(messageToApi),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { threadId } = await params;
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }
  const ok = await assertThreadParticipant(threadId, v.user.id);
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      : '';
  const attachListing =
    typeof bodyJson === 'object' &&
    bodyJson !== null &&
    'attachListing' in bodyJson &&
    (bodyJson as { attachListing: unknown }).attachListing === true;

  const trimmed = body.trim();
  if (!trimmed && !attachListing) {
    return NextResponse.json({ error: 'body required' }, { status: 400 });
  }

  const explicitListingId =
    typeof bodyJson === 'object' &&
    bodyJson !== null &&
    'listingId' in bodyJson &&
    typeof (bodyJson as { listingId: unknown }).listingId === 'string'
      ? (bodyJson as { listingId: string }).listingId.trim()
      : '';

  const thread = await getThreadById(threadId);
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const listingIdForSnap = (thread.listingId ?? explicitListingId) || null;

  if (attachListing && !listingIdForSnap) {
    return NextResponse.json({ error: 'listingId required when attaching a listing card' }, { status: 400 });
  }

  if (attachListing && listingIdForSnap) {
    const db = getDb();
    const [row] = await db
      .select({ sellerId: listings.sellerId })
      .from(listings)
      .where(eq(listings.id, listingIdForSnap))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (row.sellerId !== thread.buyerId && row.sellerId !== thread.sellerId) {
      return NextResponse.json({ error: 'Invalid listing for this conversation' }, { status: 400 });
    }
  }

  const listingSnapshot = attachListing && listingIdForSnap ? await buildListingSnapshot(listingIdForSnap) : null;
  if (attachListing && !listingSnapshot) {
    return NextResponse.json({ error: 'Failed to build listing snapshot' }, { status: 500 });
  }

  const msg = await insertMessage({
    threadId,
    senderId: v.user.id,
    body,
    listingSnapshot: attachListing ? listingSnapshot : null,
  });
  if (!msg) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({
    message: messageToApi(msg),
  });
}
