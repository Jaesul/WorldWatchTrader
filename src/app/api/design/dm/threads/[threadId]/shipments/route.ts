import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireDesignViewer } from '@/app/api/design/dm/_viewer';
import { getDb } from '@/db';
import { dmMessages } from '@/db/schema';
import {
  createShipment,
  type DmShipmentError,
} from '@/db/queries/dm-shipments';
import {
  assertThreadParticipant,
  messagesToApi,
} from '@/db/queries/dm-threads';
import { isUuid } from '@/lib/design/is-uuid';

function errorToStatus(err: DmShipmentError): number {
  switch (err) {
    case 'thread_not_found':
    case 'deal_not_found':
    case 'shipment_not_found':
      return 404;
    case 'not_participant':
    case 'deal_not_linkable':
      return 403;
    case 'invalid_carrier':
    case 'invalid_tracking':
    case 'invalid_tracking_url':
    case 'missing_tracking':
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

  const obj = body as Record<string, unknown>;
  const trackingNumber =
    typeof obj.trackingNumber === 'string' ? obj.trackingNumber : undefined;
  const trackingUrl =
    typeof obj.trackingUrl === 'string' ? obj.trackingUrl : undefined;
  const carrierCode =
    typeof obj.carrierCode === 'string' ? obj.carrierCode : undefined;
  const linkedDealIdRaw = obj.linkedDealId;
  let linkedDealId: string | null | undefined;
  if (linkedDealIdRaw === null || linkedDealIdRaw === undefined) {
    linkedDealId = linkedDealIdRaw as null | undefined;
  } else if (typeof linkedDealIdRaw === 'string') {
    if (!isUuid(linkedDealIdRaw)) {
      return NextResponse.json(
        { error: 'linkedDealId must be a uuid' },
        { status: 400 },
      );
    }
    linkedDealId = linkedDealIdRaw;
  } else {
    return NextResponse.json(
      { error: 'linkedDealId must be a string' },
      { status: 400 },
    );
  }

  if (!trackingNumber?.trim() && !trackingUrl?.trim()) {
    return NextResponse.json(
      { error: 'trackingNumber or trackingUrl is required' },
      { status: 400 },
    );
  }

  const result = await createShipment({
    threadId,
    senderId: v.user.id,
    carrierCode,
    trackingNumber,
    trackingUrl,
    listingDealId: linkedDealId,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error) },
    );
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(dmMessages)
    .where(eq(dmMessages.id, result.messageId))
    .limit(1);
  const [apiMsg] = row ? await messagesToApi([row]) : [null];
  return NextResponse.json({
    shipment: result.shipment,
    messageId: result.messageId,
    message: apiMsg ?? null,
  });
}
