import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { createTransactionRequest, type DmTxRequestError } from '@/db/queries/dm-transactions';
import { assertThreadParticipant } from '@/db/queries/dm-threads';
import { isUuid } from '@/lib/design/is-uuid';

function errorToStatus(err: DmTxRequestError): number {
  switch (err) {
    case 'thread_not_found':
    case 'listing_not_found':
    case 'request_not_found':
      return 404;
    case 'not_seller':
    case 'not_participant':
    case 'not_recipient':
      return 403;
    case 'duplicate_pending':
      return 409;
    case 'invalid_price':
    case 'invalid_description':
    case 'invalid_reason':
    case 'invalid_status':
      return 400;
  }
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
  const participant = await assertThreadParticipant(threadId, v.user.id);
  if (!participant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const listingId = (body as { listingId?: unknown }).listingId;
  const priceUsd = (body as { priceUsd?: unknown }).priceUsd;
  const description = (body as { description?: unknown }).description;

  if (typeof listingId !== 'string' || !isUuid(listingId)) {
    return NextResponse.json({ error: 'listingId required' }, { status: 400 });
  }
  if (typeof priceUsd !== 'number' || !Number.isFinite(priceUsd)) {
    return NextResponse.json({ error: 'priceUsd required' }, { status: 400 });
  }
  const descriptionStr = typeof description === 'string' ? description : '';

  const result = await createTransactionRequest({
    threadId,
    listingId,
    senderId: v.user.id,
    priceUsd: Math.round(priceUsd),
    description: descriptionStr,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) },
    );
  }

  return NextResponse.json({
    request: result.request,
    messageId: result.messageId,
  });
}
