/**
 * Calls World GET /api/v2/minikit/transaction/{id}?type=payment (same as finalize verify).
 *
 * Usage:
 *   npx tsx scripts/test-minikit-payment-transaction-get.ts [transactionId]
 *
 * - With [transactionId]: fetches exactly one payment transaction.
 * - Without args: requires DATABASE_URL and fetches all distinct
 *   listing_deals.user_op_hash values for executed_with = 'minikit_pay'.
 *
 * Loads .env.local for DATABASE_URL only (optional auto-pick of transaction id).
 *
 * @see https://docs.world.org/api-reference/developer-portal/get-transaction
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import postgres from 'postgres';

import { parsePaymentVerifyTransactionHash } from '../src/lib/settlement/verify-minikit-payment';

config({ path: resolve(process.cwd(), '.env.local') });

async function payTransactionIdsFromDb(): Promise<string[]> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return [];
  const sql = postgres(url, { max: 1 });
  try {
    const rows = await sql<
      { user_op_hash: string }[]
    >`select distinct user_op_hash from listing_deals
      where executed_with = 'minikit_pay'
        and user_op_hash is not null
        and length(trim(user_op_hash)) > 0
      order by user_op_hash asc`;
    return rows.map((r) => r.user_op_hash.trim()).filter((x) => x.length > 0);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

type TxFetchResult = {
  transactionId: string;
  httpStatus: number;
  ok: boolean;
  parsedHash: string | null;
  transactionStatus: string | null;
  body: unknown;
};

async function fetchPaymentTransaction(input: {
  transactionId: string;
  appId: string;
  apiKey: string;
}): Promise<TxFetchResult> {
  const { transactionId, appId, apiKey } = input;
  const url = new URL(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${encodeURIComponent(transactionId)}`,
  );
  url.searchParams.set('app_id', appId);
  url.searchParams.set('type', 'payment');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    // keep raw text body
  }

  const parsedHash = typeof body === 'object' && body !== null
    ? parsePaymentVerifyTransactionHash(body)
    : null;
  const transactionStatus =
    typeof body === 'object' &&
    body !== null &&
    'transactionStatus' in body &&
    typeof (body as Record<string, unknown>).transactionStatus === 'string'
      ? ((body as Record<string, unknown>).transactionStatus as string)
      : null;

  return {
    transactionId,
    httpStatus: res.status,
    ok: res.ok,
    parsedHash,
    transactionStatus,
    body,
  };
}

async function main() {
  const argTransactionId = (process.argv[2] ?? '').trim();

  // LOCAL TEST ONLY — remove or revert before git push; rotate key if exposed.
  const appId = 'app_b307365ade1a0c3716c03898eb4f2c51';
  const apiKey =
    'api_a2V5Xzg5Yjc0YWVmNmUzNDE1ZDZmYjcwMGRiMjgwOGE3OTkzOnNrX2I3NDY3YWZhNjRkNmU4ZWJlZDYzODRlMmU2NDFkNWJhNzBkNTUwYTYwMmE0OTM5Mg';

  const transactionIds = argTransactionId
    ? [argTransactionId]
    : await payTransactionIdsFromDb();

  if (transactionIds.length === 0) {
    console.error(
      'No transaction ids found. Pass one explicitly or set DATABASE_URL with minikit_pay rows.',
    );
    process.exit(1);
  }

  console.log(`Checking ${transactionIds.length} transaction(s)...`);

  const results: TxFetchResult[] = [];
  for (const transactionId of transactionIds) {
    const result = await fetchPaymentTransaction({ transactionId, appId, apiKey });
    results.push(result);
  }

  const summary = results.map((r) => ({
    transactionId: r.transactionId,
    httpStatus: r.httpStatus,
    ok: r.ok,
    transactionStatus: r.transactionStatus,
    parsedHash: r.parsedHash,
  }));
  console.table(summary);

  const withHash = results.filter((r) => r.parsedHash);
  const withoutHash = results.filter((r) => !r.parsedHash);
  console.log(`Resolved hashes: ${withHash.length}/${results.length}`);

  if (withoutHash.length > 0) {
    console.log('\nTransactions without parsed hash:');
    for (const r of withoutHash) {
      console.log('-', r.transactionId, `(http ${r.httpStatus}, status=${r.transactionStatus ?? 'unknown'})`);
    }
  }

  console.log('\nFull responses:');
  for (const r of results) {
    console.log(`\n=== ${r.transactionId} ===`);
    console.log(JSON.stringify(r.body, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
