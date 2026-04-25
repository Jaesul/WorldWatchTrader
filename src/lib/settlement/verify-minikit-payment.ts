type VerifyOk = { ok: true; json: unknown };
type VerifyFail = { ok: false; reason: 'missing_config' | 'http_error' | 'bad_response' };

function isExplorerTxHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

function pickHexTxFromObject(o: Record<string, unknown>): string | null {
  /** Omit generic `hash` — verify payloads often include unrelated 32-byte hex (e.g. Merkle roots). */
  const keys = [
    'transaction_hash',
    'transactionHash',
    'tx_hash',
    'onchain_transaction_hash',
    'on_chain_transaction_hash',
  ];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && isExplorerTxHash(v)) return v.trim();
  }
  return null;
}

/**
 * Best-effort parse of World payment verification JSON for a Worldscan-style tx hash.
 * Official MiniKit pay docs only document `transactionId` / `reference` / `from` / `chain` / `timestamp`
 * on the client; the verify API response shape is not guaranteed to include an on-chain hash.
 *
 * @see https://docs.world.org/mini-apps/commands/pay
 */
export function extractExplorerTransactionHash(json: unknown): string | null {
  const seen = new Set<unknown>();

  function walk(v: unknown): string | null {
    if (v == null || typeof v !== 'object') return null;
    if (seen.has(v)) return null;
    seen.add(v);

    if (Array.isArray(v)) {
      for (const el of v) {
        const r = walk(el);
        if (r) return r;
      }
      return null;
    }

    const o = v as Record<string, unknown>;
    const tx = pickHexTxFromObject(o);
    if (tx) return tx;

    for (const val of Object.values(o)) {
      const r = walk(val);
      if (r) return r;
    }
    return null;
  }

  return walk(json);
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
