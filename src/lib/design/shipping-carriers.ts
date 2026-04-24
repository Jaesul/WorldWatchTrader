import type { DmShipmentCarrierCode } from '@/db/schema';

export type CarrierCode = DmShipmentCarrierCode;

export type CarrierInfo = {
  code: CarrierCode;
  name: string;
};

export const CARRIERS: readonly CarrierInfo[] = [
  { code: 'ups', name: 'UPS' },
  { code: 'fedex', name: 'FedEx' },
  { code: 'usps', name: 'USPS' },
  { code: 'dhl', name: 'DHL' },
  { code: 'other', name: 'Other' },
] as const;

export function carrierName(code: CarrierCode): string {
  return CARRIERS.find((c) => c.code === code)?.name ?? 'Other';
}

/** Strip all whitespace and uppercase the raw tracking input for matching. */
export function normalizeTrackingNumber(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/**
 * Attempt to identify the carrier from a tracking-number string alone. Pattern
 * matching is intentionally conservative: overlapping formats (e.g. a 10-digit
 * code can be DHL *or* generic) are resolved by ordering — the first rule that
 * matches wins. Returns `null` if nothing matches.
 */
export function detectCarrier(
  tracking: string,
): { code: Exclude<CarrierCode, 'other'>; name: string; url: string } | null {
  const t = normalizeTrackingNumber(tracking);
  if (!t) return null;

  if (/^1Z[A-Z0-9]{16}$/.test(t)) {
    return { code: 'ups', name: 'UPS', url: `https://www.ups.com/track?tracknum=${t}` };
  }
  // USPS IMPB tracking numbers (22 digits w/ service code prefix) or
  // international S10 style like "RA999999999US".
  if (/^(94|93|92|95|82)\d{18,22}$/.test(t) || /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(t)) {
    return {
      code: 'usps',
      name: 'USPS',
      url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
    };
  }
  if (/^\d{12}$|^\d{15}$|^\d{20}$/.test(t)) {
    return { code: 'fedex', name: 'FedEx', url: `https://www.fedex.com/fedextrack/?trknbr=${t}` };
  }
  if (/^\d{10}$|^\d{11}$/.test(t)) {
    return {
      code: 'dhl',
      name: 'DHL',
      url: `https://www.dhl.com/en/express/tracking.html?AWB=${t}`,
    };
  }
  return null;
}

/**
 * Build a carrier tracking URL for a known carrier + tracking number. Returns
 * `null` for unknown carriers or empty tracking numbers.
 */
export function carrierTrackingUrl(
  code: Exclude<CarrierCode, 'other'>,
  trackingNumber: string,
): string {
  const t = normalizeTrackingNumber(trackingNumber);
  switch (code) {
    case 'ups':
      return `https://www.ups.com/track?tracknum=${t}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    case 'dhl':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`;
  }
}

/**
 * Validate a user-supplied tracking URL. Requires `http` or `https` and a
 * non-empty hostname so we never store `javascript:` / `data:` payloads.
 */
export function isValidTrackingUrl(raw: string): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}
