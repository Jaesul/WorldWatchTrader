import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import {
  prepareAcceptTransactionRequest,
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
    default:
      return 400;
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const { requestId } = await params;
  if (!isUuid(requestId)) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
  }

  const result = await prepareAcceptTransactionRequest(requestId, v.user.id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) },
    );
  }

  return NextResponse.json({
    request: result.request,
    payload: result.payload,
  });
}
