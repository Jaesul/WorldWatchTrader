/**
 * Seeds 15 sold listings for one seller profile:
 * - Seller: `jaesul.9405`
 * - Buyers: the first two users other than seller and `ajemian.*`
 * - Status: sold with confirmed mock `listing_deals`
 * - Dates: varied and all older than today
 * - Photos: one existing photo per listing from LISTINGS[]
 *
 * Run: `npm run db:seed` (requires DATABASE_URL).
 */
import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { asc, eq, ne, or, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import postgres from 'postgres';

import * as schema from './schema';
import { listingDeals, listingPhotos, listings, users } from './schema';
import { buildMockPublicProfileSoldParts } from '@/lib/design/on-chain-sale-mock';
import { LISTINGS, type Listing } from '@/lib/design/data';

loadEnv();
loadEnv({ path: '.env.local', override: true });

const TARGET_SELLER_LOGIN = 'jaesul.9405';
const EXCLUDED_SEED_LOGIN = 'ajemian.2718';
const TARGET_SALES = 15;

function teaserFrom(description: string, max = 200): string {
  const t = description.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function detailsFrom(l: Listing): string {
  const base = l.description.trim();
  const extra = l.boxPapers ? `\n\nBox/papers: ${l.boxPapers}` : '';
  return `${base}${extra}`;
}

function hash64(input: string): string {
  return `0x${createHash('sha256').update(input).digest('hex')}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  await db.transaction(async (tx) => {
    const sellerLower = TARGET_SELLER_LOGIN.toLowerCase();
    const [seller] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        or(
          sql`lower(coalesce(${users.handle}, '')) = ${sellerLower}`,
          sql`lower(coalesce(${users.username}, '')) = ${sellerLower}`,
        ),
      )
      .limit(1);
    if (!seller) {
      throw new Error(`Seller ${TARGET_SELLER_LOGIN} not found`);
    }

    const excludedLower = EXCLUDED_SEED_LOGIN.toLowerCase();
    const [excludedUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        or(
          sql`lower(coalesce(${users.handle}, '')) = ${excludedLower}`,
          sql`lower(coalesce(${users.username}, '')) = ${excludedLower}`,
        ),
      )
      .limit(1);
    const excludedId = excludedUser?.id ?? null;

    const buyersQuery = tx
      .select({ id: users.id, walletAddress: users.walletAddress })
      .from(users)
      .where(ne(users.id, seller.id))
      .orderBy(asc(users.createdAt))
      .$dynamic();
    const buyers = await (excludedId
      ? buyersQuery.where(ne(users.id, excludedId)).limit(2)
      : buyersQuery.limit(2));
    if (buyers.length < 2) {
      throw new Error('Need at least two buyer users besides seller / excluded account');
    }

    const [sellerRow] = await tx.select().from(users).where(eq(users.id, seller.id)).limit(1);
    if (!sellerRow) throw new Error('Seller row unavailable');

    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(12, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);

    for (let i = 0; i < TARGET_SALES; i++) {
      const l = LISTINGS[i % LISTINGS.length]!;
      const confirmedAt = new Date(start);
      confirmedAt.setUTCDate(start.getUTCDate() - i * 3);
      confirmedAt.setUTCHours(10 + (i % 8), (i * 13) % 60, 0, 0);
      const buyer = buyers[i % buyers.length]!;
      const [listingRow] = await tx
        .insert(listings)
        .values({
          sellerId: seller.id,
          status: 'sold',
          title: `${l.model} #${String(i + 1).padStart(2, '0')}`,
          teaser: teaserFrom(l.description),
          details: detailsFrom(l),
          priceUsd: l.price + (i % 5) * 75,
          condition: l.condition,
          modelNumber: null,
          caseSize: null,
          city: null,
          stateRegion: null,
          countryCode: null,
          orbVerifiedAtListing: sellerRow.orbVerified ? confirmedAt : null,
          publishedAt: new Date(confirmedAt.getTime() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(confirmedAt.getTime() - 6 * 24 * 60 * 60 * 1000),
          updatedAt: confirmedAt,
        })
        .returning({ id: listings.id, priceUsd: listings.priceUsd });
      if (!listingRow) continue;

      const photo = l.photos[0];
      if (photo) {
        await tx.insert(listingPhotos).values({
          listingId: listingRow.id,
          url: photo,
          sortOrder: 0,
        });
      }

      const { settlement } = buildMockPublicProfileSoldParts({
        listingId: listingRow.id,
        updatedAt: confirmedAt,
        priceUsd: listingRow.priceUsd,
      });
      const userOpHash = hash64(`seed-uop:${listingRow.id}:${confirmedAt.toISOString()}:${i}`);
      const transactionHash = hash64(`seed-tx:${listingRow.id}:${confirmedAt.toISOString()}:${i}`);
      const amountRaw =
        settlement.token === 'USDC'
          ? (BigInt(listingRow.priceUsd) * BigInt(1_000_000)).toString()
          : (BigInt(listingRow.priceUsd) * BigInt(10) ** BigInt(19) / BigInt(24)).toString();

      await tx.insert(listingDeals).values({
        listingId: listingRow.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        status: 'confirmed',
        chainId: 480,
        chainName: settlement.chainName,
        userOpHash,
        transactionHash,
        fromAddress: buyer.walletAddress,
        toAddress: sellerRow.walletAddress,
        tokenContract: null,
        tokenSymbol: settlement.token,
        amountRaw,
        priceUsd: listingRow.priceUsd,
        executedWith: 'mock',
        failureReason: null,
        confirmedAt,
        createdAt: confirmedAt,
        updatedAt: confirmedAt,
      });
    }
  });

  const sellerLower = TARGET_SELLER_LOGIN.toLowerCase();
  const [seller] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        sql`lower(coalesce(${users.handle}, '')) = ${sellerLower}`,
        sql`lower(coalesce(${users.username}, '')) = ${sellerLower}`,
      ),
    )
    .limit(1);
  const [{ total }] = seller
    ? await db
        .select({ total: sql<number>`count(*)::int` })
        .from(listings)
        .where(eq(listings.sellerId, seller.id))
    : [{ total: 0 }];

  console.log(
    `Seed complete. Created ${TARGET_SALES} sold listings for ${TARGET_SELLER_LOGIN} (buyers exclude ${EXCLUDED_SEED_LOGIN}); seller now has ${total} listings.`,
  );
  await client.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
