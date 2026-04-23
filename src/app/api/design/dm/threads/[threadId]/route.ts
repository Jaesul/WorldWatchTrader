import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { getDmThreadDetailForViewer } from '@/db/queries/dm-threads';
import { isUuid } from '@/lib/design/is-uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { threadId } = await params;
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }
  const u = new URL(request.url);
  const rawCompose = u.searchParams.get('listingContext')?.trim() ?? '';
  const composeListingId = isUuid(rawCompose) ? rawCompose : null;
  const detail = await getDmThreadDetailForViewer(threadId, v.user.id, { composeListingId });
  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { thread, listing, listingImageUrl, counterpart } = detail;
  return NextResponse.json({
    thread: {
      id: thread.id,
      buyerId: thread.buyerId,
      sellerId: thread.sellerId,
      listingId: thread.listingId,
      lastMessageAt: thread.lastMessageAt.toISOString(),
    },
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          priceUsd: listing.priceUsd,
          status: listing.status,
          imageUrl: listingImageUrl,
        }
      : null,
    counterpart: {
      id: counterpart.id,
      username: counterpart.username,
      handle: counterpart.handle,
      profilePictureUrl: counterpart.profilePictureUrl,
      walletAddress: counterpart.walletAddress,
      orbVerified: counterpart.orbVerified,
    },
  });
}
