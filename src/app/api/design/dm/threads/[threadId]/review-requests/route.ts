import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { createReviewRequest, listLinkableCompletedDealsForThread } from '@/db/queries/dm-reviews';
import { isUuid } from '@/lib/design/is-uuid';

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
  const result = await listLinkableCompletedDealsForThread(threadId, v.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'thread_not_found' ? 404 : 403 });
  }
  return NextResponse.json({ deals: result.deals });
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const listingDealId =
    typeof body === 'object' && body !== null && 'listingDealId' in body && typeof (body as { listingDealId: unknown }).listingDealId === 'string'
      ? (body as { listingDealId: string }).listingDealId
      : '';
  if (!isUuid(listingDealId)) {
    return NextResponse.json({ error: 'Invalid listing deal id' }, { status: 400 });
  }
  const result = await createReviewRequest({
    threadId,
    listingDealId,
    sellerId: v.user.id,
  });
  if (!result.ok) {
    const status =
      result.error === 'thread_not_found'
        ? 404
        : result.error === 'forbidden'
          ? 403
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({
    request: result.request,
    messageId: result.messageId,
  });
}

