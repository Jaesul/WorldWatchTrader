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
    case 'invalid_tx_hash':
    case 'invalid_user_op_hash':
    case 'invalid_status':
    case 'already_resolved':
      return 400;
    default:
      return 400;
  }
}

type FinalizeBody = {
  userOpHash?: unknown;
  transactionHash?: unknown;
  chainId?: unknown;
  chainName?: unknown;
  tokenSymbol?: unknown;
  amountRaw?: unknown;
  fromAddress?: unknown;
  toAddress?: unknown;
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

  const userOpHash = typeof body.userOpHash === 'string' ? body.userOpHash : '';
  const transactionHash =
    typeof body.transactionHash === 'string' ? body.transactionHash : null;
  const chainId = typeof body.chainId === 'number' ? body.chainId : 480;
  const chainName = typeof body.chainName === 'string' ? body.chainName : 'World Chain';
  const tokenSymbol = typeof body.tokenSymbol === 'string' ? body.tokenSymbol : 'ETH';
  const amountRaw = typeof body.amountRaw === 'string' ? body.amountRaw : '';
  const fromAddress = typeof body.fromAddress === 'string' ? body.fromAddress : '';
  const toAddress = typeof body.toAddress === 'string' ? body.toAddress : '';

  const result = await finalizeAcceptedTransactionRequest({
    requestId,
    viewerId: v.user.id,
    userOpHash,
    transactionHash,
    chainId,
    chainName,
    tokenSymbol,
    amountRaw,
    fromAddress,
    toAddress,
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
