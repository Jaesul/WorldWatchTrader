import { and, desc, eq, inArray } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  dmMessages,
  dmShipments,
  dmThreads,
  listingDeals,
  listingPhotos,
  listings,
  type DmShipmentCarrierCode,
} from '@/db/schema';
import {
  carrierName as lookupCarrierName,
  carrierTrackingUrl,
  detectCarrier,
  isValidTrackingUrl,
  normalizeTrackingNumber,
} from '@/lib/design/shipping-carriers';

export type DmShipmentError =
  | 'thread_not_found'
  | 'not_participant'
  | 'invalid_carrier'
  | 'invalid_tracking'
  | 'invalid_tracking_url'
  | 'missing_tracking'
  | 'deal_not_found'
  | 'deal_not_linkable'
  | 'shipment_not_found';

/** Minimal info attached to a shipment when it's linked to a confirmed sale. */
export type DmShipmentLinkedDeal = {
  dealId: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  priceUsd: number;
  confirmedAt: string | null;
};

/** API-safe shipment snapshot rendered in the chat thread. */
export type DmShipmentSnapshot = {
  shipmentId: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  carrierCode: DmShipmentCarrierCode;
  carrierName: string;
  trackingNumber: string | null;
  trackingUrl: string;
  linkedDeal: DmShipmentLinkedDeal | null;
  createdAt: string;
  updatedAt: string;
};

const VALID_CODES: readonly DmShipmentCarrierCode[] = [
  'ups',
  'fedex',
  'usps',
  'dhl',
  'other',
] as const;

function isValidCarrierCode(x: string): x is DmShipmentCarrierCode {
  return (VALID_CODES as readonly string[]).includes(x);
}

function toSnapshot(
  row: typeof dmShipments.$inferSelect,
  linkedDeal: DmShipmentLinkedDeal | null,
): DmShipmentSnapshot {
  return {
    shipmentId: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    recipientId: row.recipientId,
    carrierCode: row.carrierCode as DmShipmentCarrierCode,
    carrierName: row.carrierName,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    linkedDeal,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type CreateShipmentInput = {
  threadId: string;
  senderId: string;
  carrierCode?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  listingDealId?: string | null;
};

/**
 * Insert a shipping update plus its carrier chat message. Either a tracking
 * number (with detected/explicit carrier) or a raw tracking URL is required.
 * If `listingDealId` is provided, it must refer to a confirmed deal between
 * the same two thread participants, with `sellerId === senderId`.
 */
export async function createShipment(input: CreateShipmentInput): Promise<
  | {
      ok: true;
      shipment: DmShipmentSnapshot;
      messageId: string;
    }
  | { ok: false; error: DmShipmentError }
> {
  let explicitCode: DmShipmentCarrierCode | null = null;
  if (typeof input.carrierCode === 'string' && input.carrierCode.length > 0) {
    const normalized = input.carrierCode.toLowerCase();
    if (!isValidCarrierCode(normalized)) {
      return { ok: false, error: 'invalid_carrier' };
    }
    explicitCode = normalized;
  }

  const tracking = input.trackingNumber
    ? normalizeTrackingNumber(input.trackingNumber)
    : '';
  const rawUrl = input.trackingUrl?.trim() ?? '';

  let code: DmShipmentCarrierCode | null = explicitCode;
  let trackingUrl = '';
  const trackingNumber: string | null = tracking || null;

  if (tracking) {
    if (code && code !== 'other') {
      trackingUrl = carrierTrackingUrl(code, tracking);
    } else if (!code) {
      const detected = detectCarrier(tracking);
      if (detected) {
        code = detected.code;
        trackingUrl = detected.url;
      } else {
        // No explicit carrier, tracking didn't match any pattern — fall back
        // to 'other' and require the caller to supply a URL.
        code = 'other';
      }
    }
  }

  if (code === 'other' || (!tracking && !code)) {
    if (!rawUrl || !isValidTrackingUrl(rawUrl)) {
      return { ok: false, error: 'invalid_tracking_url' };
    }
    trackingUrl = rawUrl;
    if (!code) code = 'other';
  } else if (!trackingUrl && rawUrl) {
    if (!isValidTrackingUrl(rawUrl)) {
      return { ok: false, error: 'invalid_tracking_url' };
    }
    trackingUrl = rawUrl;
  }

  if (!trackingUrl) {
    return { ok: false, error: 'missing_tracking' };
  }
  if (!code) {
    return { ok: false, error: 'invalid_carrier' };
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [thread] = await tx
      .select()
      .from(dmThreads)
      .where(eq(dmThreads.id, input.threadId))
      .limit(1);
    if (!thread) return { ok: false as const, error: 'thread_not_found' as const };
    if (thread.buyerId !== input.senderId && thread.sellerId !== input.senderId) {
      return { ok: false as const, error: 'not_participant' as const };
    }
    const recipientId =
      thread.buyerId === input.senderId ? thread.sellerId : thread.buyerId;

    let linkedDealId: string | null = null;
    let linkedDeal: DmShipmentLinkedDeal | null = null;
    if (input.listingDealId) {
      const [dealRow] = await tx
        .select({ deal: listingDeals, listing: listings })
        .from(listingDeals)
        .innerJoin(listings, eq(listings.id, listingDeals.listingId))
        .where(eq(listingDeals.id, input.listingDealId))
        .limit(1);
      if (!dealRow) return { ok: false as const, error: 'deal_not_found' as const };
      const d = dealRow.deal;
      const sameParties =
        (d.sellerId === input.senderId && d.buyerId === recipientId) ||
        (d.sellerId === recipientId && d.buyerId === input.senderId);
      if (!sameParties || d.sellerId !== input.senderId || d.status !== 'confirmed') {
        return { ok: false as const, error: 'deal_not_linkable' as const };
      }
      linkedDealId = d.id;
      const [photo] = await tx
        .select({ url: listingPhotos.url })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, d.listingId))
        .orderBy(listingPhotos.sortOrder)
        .limit(1);
      linkedDeal = {
        dealId: d.id,
        listingId: d.listingId,
        listingTitle: dealRow.listing.title,
        listingImageUrl: photo?.url ?? null,
        priceUsd: d.priceUsd,
        confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
      };
    }

    const [shipmentRow] = await tx
      .insert(dmShipments)
      .values({
        threadId: input.threadId,
        senderId: input.senderId,
        recipientId,
        listingDealId: linkedDealId,
        carrierCode: code,
        carrierName: lookupCarrierName(code),
        trackingNumber,
        trackingUrl,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!shipmentRow) throw new Error('Failed to create shipment');

    const [msg] = await tx
      .insert(dmMessages)
      .values({
        threadId: input.threadId,
        senderId: input.senderId,
        body: '',
        shipmentId: shipmentRow.id,
        createdAt: now,
      })
      .returning();
    if (!msg) throw new Error('Failed to insert shipment chat message');

    await tx
      .update(dmThreads)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(eq(dmThreads.id, input.threadId));

    return {
      ok: true as const,
      shipment: toSnapshot(shipmentRow, linkedDeal),
      messageId: msg.id,
    };
  });
}

/** Fetch a single shipment as the given viewer (participant-only). */
export async function getShipmentById(
  shipmentId: string,
  viewerId: string,
): Promise<DmShipmentSnapshot | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(dmShipments)
    .where(eq(dmShipments.id, shipmentId))
    .limit(1);
  if (!row) return null;
  if (row.senderId !== viewerId && row.recipientId !== viewerId) return null;

  const linkedDeal = await fetchLinkedDeal(row.listingDealId);
  return toSnapshot(row, linkedDeal);
}

async function fetchLinkedDeal(
  listingDealId: string | null,
): Promise<DmShipmentLinkedDeal | null> {
  if (!listingDealId) return null;
  const db = getDb();
  const [row] = await db
    .select({ deal: listingDeals, listing: listings })
    .from(listingDeals)
    .innerJoin(listings, eq(listings.id, listingDeals.listingId))
    .where(eq(listingDeals.id, listingDealId))
    .limit(1);
  if (!row) return null;
  const [photo] = await db
    .select({ url: listingPhotos.url })
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, row.deal.listingId))
    .orderBy(listingPhotos.sortOrder)
    .limit(1);
  return {
    dealId: row.deal.id,
    listingId: row.deal.listingId,
    listingTitle: row.listing.title,
    listingImageUrl: photo?.url ?? null,
    priceUsd: row.deal.priceUsd,
    confirmedAt: row.deal.confirmedAt ? row.deal.confirmedAt.toISOString() : null,
  };
}

/**
 * Batch-hydrate shipment snapshots for a set of message rows. Returns a map
 * keyed by shipment id.
 */
export async function mapShipmentsForMessages(
  rows: ReadonlyArray<{ shipmentId: string | null }>,
): Promise<Map<string, DmShipmentSnapshot>> {
  const ids = Array.from(
    new Set(
      rows
        .map((r) => r.shipmentId)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  );
  if (ids.length === 0) return new Map();

  const db = getDb();
  const shipmentRows = await db
    .select()
    .from(dmShipments)
    .where(inArray(dmShipments.id, ids));
  if (shipmentRows.length === 0) return new Map();

  const dealIds = Array.from(
    new Set(
      shipmentRows
        .map((s) => s.listingDealId)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  );

  const linkedDealByDealId = new Map<string, DmShipmentLinkedDeal>();
  if (dealIds.length > 0) {
    const dealRows = await db
      .select({ deal: listingDeals, listing: listings })
      .from(listingDeals)
      .innerJoin(listings, eq(listings.id, listingDeals.listingId))
      .where(inArray(listingDeals.id, dealIds));

    const listingIds = Array.from(
      new Set(dealRows.map((r) => r.deal.listingId)),
    );
    const heroByListing = new Map<string, string>();
    if (listingIds.length > 0) {
      const photos = await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, listingIds))
        .orderBy(listingPhotos.sortOrder);
      for (const p of photos) {
        if (!heroByListing.has(p.listingId)) heroByListing.set(p.listingId, p.url);
      }
    }

    for (const { deal, listing } of dealRows) {
      linkedDealByDealId.set(deal.id, {
        dealId: deal.id,
        listingId: deal.listingId,
        listingTitle: listing.title,
        listingImageUrl: heroByListing.get(deal.listingId) ?? null,
        priceUsd: deal.priceUsd,
        confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
      });
    }
  }

  const out = new Map<string, DmShipmentSnapshot>();
  for (const row of shipmentRows) {
    const linkedDeal = row.listingDealId
      ? linkedDealByDealId.get(row.listingDealId) ?? null
      : null;
    out.set(row.id, toSnapshot(row, linkedDeal));
  }
  return out;
}

export type ListLinkableDealRow = {
  dealId: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  priceUsd: number;
  confirmedAt: string | null;
  alreadyShipped: boolean;
};

/**
 * Confirmed deals where `senderId` is the seller and the thread counterpart is
 * the buyer. Used by the send-shipping sheet's linker. Flags deals that are
 * already attached to a shipment so the UI can note duplicates without hiding
 * them.
 */
export async function listLinkableDealsForThread(
  threadId: string,
  senderId: string,
): Promise<ListLinkableDealRow[]> {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(dmThreads)
    .where(eq(dmThreads.id, threadId))
    .limit(1);
  if (!thread) return [];
  if (thread.buyerId !== senderId && thread.sellerId !== senderId) return [];

  const recipientId =
    thread.buyerId === senderId ? thread.sellerId : thread.buyerId;

  const rows = await db
    .select({ deal: listingDeals, listing: listings })
    .from(listingDeals)
    .innerJoin(listings, eq(listings.id, listingDeals.listingId))
    .where(
      and(
        eq(listingDeals.sellerId, senderId),
        eq(listingDeals.buyerId, recipientId),
        eq(listingDeals.status, 'confirmed'),
      ),
    )
    .orderBy(desc(listingDeals.confirmedAt));

  if (rows.length === 0) return [];

  const dealIds = rows.map((r) => r.deal.id);
  const listingIds = Array.from(new Set(rows.map((r) => r.deal.listingId)));

  const [photos, shippedRows] = await Promise.all([
    db
      .select()
      .from(listingPhotos)
      .where(inArray(listingPhotos.listingId, listingIds))
      .orderBy(listingPhotos.sortOrder),
    db
      .select({ listingDealId: dmShipments.listingDealId })
      .from(dmShipments)
      .where(inArray(dmShipments.listingDealId, dealIds)),
  ]);

  const heroByListing = new Map<string, string>();
  for (const p of photos) {
    if (!heroByListing.has(p.listingId)) heroByListing.set(p.listingId, p.url);
  }
  const shippedDealIds = new Set<string>();
  for (const s of shippedRows) {
    if (s.listingDealId) shippedDealIds.add(s.listingDealId);
  }

  return rows.map(({ deal, listing }) => ({
    dealId: deal.id,
    listingId: deal.listingId,
    listingTitle: listing.title,
    listingImageUrl: heroByListing.get(deal.listingId) ?? null,
    priceUsd: deal.priceUsd,
    confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
    alreadyShipped: shippedDealIds.has(deal.id),
  }));
}

/**
 * For a set of deal ids, returns a map keyed by deal id to a compact shipment
 * summary used on profile history surfaces. Only the *latest* shipment per
 * deal is reported so the UI can render a single "Shipped via X" chip.
 */
export async function getShipmentFlagsForDealIds(
  dealIds: string[],
): Promise<Map<string, { carrierName: string; shippedAt: string | null }>> {
  if (dealIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({
      listingDealId: dmShipments.listingDealId,
      carrierName: dmShipments.carrierName,
      createdAt: dmShipments.createdAt,
    })
    .from(dmShipments)
    .where(inArray(dmShipments.listingDealId, dealIds))
    .orderBy(desc(dmShipments.createdAt));

  const out = new Map<string, { carrierName: string; shippedAt: string | null }>();
  for (const r of rows) {
    if (!r.listingDealId) continue;
    if (out.has(r.listingDealId)) continue;
    out.set(r.listingDealId, {
      carrierName: r.carrierName,
      shippedAt: r.createdAt ? r.createdAt.toISOString() : null,
    });
  }
  return out;
}
