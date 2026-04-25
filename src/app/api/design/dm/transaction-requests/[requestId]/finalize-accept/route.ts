import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import {
  finalizeAcceptedTransactionRequest,
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
    case 'invalid_price':
    case 'invalid_status':
    case 'already_resolved':
    case 'invalid_payment_payload':
      return 400;
    case 'payment_verify_failed':
      return 502;
    default:
      return 400;
  }
}

type FinalizeBody = {
  payResult?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { requestId } = await params;
  if (!isUuid(requestId)) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
  }

  let body: FinalizeBody;
  try {
    body = (await request.json()) as FinalizeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payResult = body.payResult;
  if (!payResult || typeof payResult !== 'object') {
    return NextResponse.json({ error: 'payResult required' }, { status: 400 });
  }
  const pr = payResult as { executedWith?: unknown; data?: unknown };
  const executedWith = typeof pr.executedWith === 'string' ? pr.executedWith : '';
  const data = pr.data && typeof pr.data === 'object' ? (pr.data as Record<string, unknown>) : {};

  const result = await finalizeAcceptedTransactionRequest({
    requestId,
    viewerId: v.user.id,
    payResult: { executedWith, data },
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
    dealId: result.dealId,
  });
}
