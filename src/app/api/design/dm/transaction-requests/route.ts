import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { listIncomingTransactionRequests } from '@/db/queries/dm-transactions';
import { isUuid } from '@/lib/design/is-uuid';

export async function GET(request: Request) {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  const threadIdParam = url.searchParams.get('threadId')?.trim();
  const status =
    statusParam === 'pending' || statusParam === 'resolved' ? statusParam : undefined;
  const threadId = threadIdParam && isUuid(threadIdParam) ? threadIdParam : undefined;

  const items = await listIncomingTransactionRequests(v.user.id, { status, threadId });
  return NextResponse.json({ requests: items });
}
