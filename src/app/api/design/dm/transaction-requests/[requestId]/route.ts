import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import {
  acceptTransactionRequest,
  declineTransactionRequest,
  getTransactionRequestById,
  type DmTxRequestError,
} from '@/db/queries/dm-transactions';
import { isUuid } from '@/lib/design/is-uuid';

function errorToStatus(err: DmTxRequestError): number {
  switch (err) {
    case 'request_not_found':
      return 404;
    case 'not_recipient':
    case 'not_participant':
    case 'not_seller':
      return 403;
    case 'invalid_status':
    case 'invalid_reason':
    case 'invalid_price':
    case 'invalid_description':
      return 400;
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
  const snap = await getTransactionRequestById(requestId, v.user.id);
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
  const action = (body as { action?: unknown }).action;

  if (action === 'accept') {
    const result = await acceptTransactionRequest(requestId, v.user.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: errorToStatus(result.error) },
      );
    }
    return NextResponse.json({
      request: result.request,
      messageId: result.messageId,
      dealId: result.dealId,
    });
  }

  if (action === 'decline') {
    const reasonRaw = (body as { reason?: unknown }).reason;
    const reason = typeof reasonRaw === 'string' ? reasonRaw : null;
    const result = await declineTransactionRequest(requestId, v.user.id, reason);
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
