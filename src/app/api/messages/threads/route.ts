import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getOrCreateThread, insertMessage, listThreadsForUser } from '@/db/queries/dm-threads';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await listThreadsForUser(userId);
  return NextResponse.json({
    threads: rows.map((r) => ({
      id: r.thread.id,
      lastMessageAt: r.thread.lastMessageAt.toISOString(),
      buyerId: r.thread.buyerId,
      sellerId: r.thread.sellerId,
      listing: r.listing
        ? {
            id: r.listing.id,
            title: r.listing.title,
            priceUsd: r.listing.priceUsd,
          }
        : null,
      lastMessageSenderId: r.lastMessageSenderId,
      counterpart: {
        id: r.counterpart.id,
        username: r.counterpart.username,
        handle: r.counterpart.handle,
        profilePictureUrl: r.counterpart.profilePictureUrl,
        walletAddress: r.counterpart.walletAddress,
      },
      lastMessagePreview: r.lastMessageBody,
    })),
  });
}

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
  const body =
    typeof bodyJson === 'object' &&
    bodyJson !== null &&
    'body' in bodyJson &&
    typeof (bodyJson as { body: unknown }).body === 'string'
      ? (bodyJson as { body: string }).body
      : null;

  if (!listingId?.trim()) {
    return NextResponse.json({ error: 'listingId required' }, { status: 400 });
  }
  if (!body?.trim()) {
    return NextResponse.json({ error: 'body required' }, { status: 400 });
  }

  const created = await getOrCreateThread(userId, listingId);
  if (!created.ok) {
    const status = created.error === 'listing_not_found' ? 404 : 400;
    return NextResponse.json({ error: created.error }, { status });
  }

  const msg = await insertMessage({
    threadId: created.thread.id,
    senderId: userId,
    body: body.trim(),
  });
  if (!msg) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json({
    threadId: created.thread.id,
    message: {
      id: msg.id,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
