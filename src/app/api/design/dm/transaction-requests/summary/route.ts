import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import {
  countPendingIncomingByThread,
  getTotalPendingIncoming,
} from '@/db/queries/dm-transactions';

export async function GET() {
  const v = await requireDesignViewer();
  if (!v.ok) return v.response;

  const [total, byThread] = await Promise.all([
    getTotalPendingIncoming(v.user.id),
    countPendingIncomingByThread(v.user.id),
  ]);

  const pendingByThread: Record<string, number> = {};
  for (const [k, n] of byThread.entries()) pendingByThread[k] = n;

  return NextResponse.json({ totalPending: total, pendingByThread });
}
