import { NextResponse } from 'next/server';
import type { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js/commands';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { getReviewRequestById, submitDealReview, type DmReviewRequestError } from '@/db/queries/dm-reviews';
import { isUuid } from '@/lib/design/is-uuid';

function errorToStatus(error: DmReviewRequestError): number {
  switch (error) {
    case 'request_not_found':
      return 404;
    case 'forbidden':
    case 'not_buyer':
      return 403;
    default:
      return 400;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;
  const { requestId } = await params;
  if (!isUuid(requestId)) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
  }
  const snap = await getReviewRequestById(requestId, v.user.id);
  if (!snap) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ request: snap });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;
  const { requestId } = await params;
  if (!isUuid(requestId)) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
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

  const rating = Number((body as { rating?: unknown }).rating);
  const comment = typeof (body as { comment?: unknown }).comment === 'string' ? (body as { comment: string }).comment : null;
  const nonce =
    typeof (body as { nonce?: unknown }).nonce === 'string' ? (body as { nonce: string }).nonce : '';
  const signedNonce =
    typeof (body as { signedNonce?: unknown }).signedNonce === 'string'
      ? (body as { signedNonce: string }).signedNonce
      : '';
  const walletAuthPayloadRaw = (body as { walletAuthPayload?: unknown }).walletAuthPayload;
  if (
    !walletAuthPayloadRaw ||
    typeof walletAuthPayloadRaw !== 'object' ||
    typeof (walletAuthPayloadRaw as { message?: unknown }).message !== 'string' ||
    typeof (walletAuthPayloadRaw as { signature?: unknown }).signature !== 'string' ||
    typeof (walletAuthPayloadRaw as { address?: unknown }).address !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid walletAuthPayload' }, { status: 400 });
  }

  const result = await submitDealReview({
    requestId,
    buyerId: v.user.id,
    rating,
    comment,
    nonce,
    signedNonce,
    walletAuthPayload: walletAuthPayloadRaw as MiniAppWalletAuthSuccessPayload,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: errorToStatus(result.error) });
  }
  return NextResponse.json({
    request: result.request,
    messageId: result.messageId,
  });
}

