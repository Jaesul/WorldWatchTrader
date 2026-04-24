import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { listLinkableDealsForThread } from '@/db/queries/dm-shipments';
import { assertThreadParticipant } from '@/db/queries/dm-threads';
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
  const participant = await assertThreadParticipant(threadId, v.user.id);
  if (!participant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deals = await listLinkableDealsForThread(threadId, v.user.id);
  return NextResponse.json({ deals });
}
