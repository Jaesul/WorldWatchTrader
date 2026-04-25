type VerifyOk = { ok: true; json: unknown };
type VerifyFail = { ok: false; reason: 'missing_config' | 'http_error' | 'bad_response' };

const EXPLORER_TX_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Reads `transaction_hash` from GET /api/v2/minikit/transaction payment JSON when present and valid.
 * @see https://docs.world.org/api-reference/developer-portal/get-transaction
 */
export function parsePaymentVerifyTransactionHash(json: unknown): string | null {
  if (json == null || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  for (const key of ['transaction_hash', 'transactionHash'] as const) {
    const v = o[key];
    if (typeof v === 'string' && EXPLORER_TX_RE.test(v.trim())) return v.trim();
  }
  return null;
}

/**
 * Confirms a MiniKit payment with World Developer API (optional when `DEV_PORTAL_API_KEY` is unset).
 * @see https://docs.world.org/mini-apps/commands/pay#backend-verification
 */
export async function verifyMinikitPayment(transactionId: string): Promise<VerifyOk | VerifyFail> {
  const appId = process.env.NEXT_PUBLIC_APP_ID?.trim();
  const apiKey = process.env.DEV_PORTAL_API_KEY?.trim();
  if (!appId || !apiKey) {
    return { ok: false, reason: 'missing_config' };
  }
  const url = new URL(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${encodeURIComponent(transactionId)}`,
  );
  url.searchParams.set('app_id', appId);
  url.searchParams.set('type', 'payment');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    return { ok: false, reason: 'http_error' };
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, reason: 'bad_response' };
  }
  return { ok: true, json };
}
