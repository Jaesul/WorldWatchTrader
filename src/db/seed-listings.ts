/**
 * Seeds dummy marketplace rows from `LISTINGS` onto **existing** users (no synthetic users).
 *
 * - Removes legacy seed users (three fixed wallet IDs) and their listings if present.
 * - Assigns listings evenly across up to the first 3 users by `created_at` (oldest first).
 * - `published_at`: unique timestamps via WeakMap on dummy listing refs (round-robin seller order), strictly decreasing.
 * - Each seeded listing gets several `listing_comments` rows authored by **existing** users (never the listing seller).
 * - Inserts up to two mock `listing_deals` (confirmed, `executed_with = mock`) and marks those listings `sold`.
 *
 * Destructive for those legacy wallet rows only. Run: `npm run db:seed` (requires DATABASE_URL).
 */
import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, asc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { getAddress } from 'viem';

import * as schema from './schema';
import { listingComments, listingDeals, listingPhotos, listings, users } from './schema';
import { buildMockPublicProfileSoldParts, mockUserOpHashForListing } from '@/lib/design/on-chain-sale-mock';
import { LISTINGS, type Listing } from '@/lib/design/data';

loadEnv();
loadEnv({ path: '.env.local', override: true });

/** Legacy seed seller IDs — removed so dummy personas (Alex Kim, etc.) are not in the DB. */
const LEGACY_SEED_WALLET_RAW = [
  '0x26d570711c1cbd5dcf322d9955350ee8ebb5a482',
  '0x2b332577afbe743d86a823123a5b579f77a8e601',
  '0xc2cb82d830b5a338b2f24a822dac95fb42d5daf7',
] as const;

const LEGACY_SEED_SELLER_IDS = LEGACY_SEED_WALLET_RAW.map((w) =>
  getAddress(w as `0x${string}`),
);

const MAX_SELLERS = 3;

/** Seeded thread bodies; authors are rotated from real `users` rows (never the listing seller). */
function seedCommentBodies(model: string, condition: string): string[] {
  const c = (condition || 'this').toLowerCase();
  return [
    `Is the ${model} still available? Any issues with the clasp?`,
    `Love this listing — ${c} makes it compelling. Is the set complete?`,
    `Would you consider a trade plus cash, or only a straight sale?`,
    `Could you share a movement shot and maybe a quick lume photo in messages?`,
    `Price looks fair for a ${c} example. How much interest have you seen so far?`,
  ];
}

/** No seeded listings on this account (matched on `handle` or `username`, case-insensitive). */
const EXCLUDED_SEED_LOGIN = 'ajemian.2718';

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

/** Round-robin merge of seller buckets so global "newest" order alternates sellers. */
function interleavedFromGroups(groups: Listing[][]): Listing[] {
  const maxLen = Math.max(0, ...groups.map((g) => g.length));
  const out: Listing[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (let g = 0; g < groups.length; g++) {
      const row = groups[g]?.[i];
      if (row) out.push(row);
    }
  }
  return out;
}

/** Unique, strictly decreasing `published_at` per listing object (WeakMap avoids duplicate string keys). */
function publishedAtByListingRef(interleaved: Listing[]): WeakMap<Listing, Date> {
  const m = new WeakMap<Listing, Date>();
  let t = Date.now() - 20 * 60 * 1000;
  for (const listing of interleaved) {
    t -= 45_000 + Math.floor(Math.random() * 6 * 60 * 60 * 1000); // 45s–6h45 per step, always strictly older
    m.set(listing, new Date(t));
  }
  return m;
}

/** Split `items` into `bucketCount` contiguous slices as evenly as possible. */
function splitEvenly<T>(items: T[], bucketCount: number): T[][] {
  const buckets: T[][] = Array.from({ length: bucketCount }, () => []);
  if (bucketCount === 0) return buckets;
  const base = Math.floor(items.length / bucketCount);
  const extra = items.length % bucketCount;
  let offset = 0;
  for (let b = 0; b < bucketCount; b++) {
    const len = base + (b < extra ? 1 : 0);
    buckets[b] = items.slice(offset, offset + len);
    offset += len;
  }
  return buckets;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  let chosenSellerIds: string[] = [];

  await db.transaction(async (tx) => {
    await tx.delete(listingComments).where(inArray(listingComments.authorId, [...LEGACY_SEED_SELLER_IDS]));
    await tx.delete(listings).where(inArray(listings.sellerId, [...LEGACY_SEED_SELLER_IDS]));
    await tx.delete(users).where(inArray(users.id, [...LEGACY_SEED_SELLER_IDS]));

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
    const excludedId = excludedUser?.id;
    if (excludedId) {
      await tx.delete(listings).where(eq(listings.sellerId, excludedId));
    }

    const sellerBase = tx
      .select({ id: users.id, orbVerified: users.orbVerified })
      .from(users)
      .$dynamic();

    const sellerRows = await (excludedId
      ? sellerBase.where(ne(users.id, excludedId)).orderBy(asc(users.createdAt)).limit(MAX_SELLERS)
      : sellerBase.orderBy(asc(users.createdAt)).limit(MAX_SELLERS));

    if (sellerRows.length === 0) {
      throw new Error(
        'No users left to assign listings (every user matched the exclusion, or the database is empty).',
      );
    }

    chosenSellerIds = sellerRows.map((r) => r.id);

    const allUserRows = await tx.select({ id: users.id }).from(users);

    const dummyTitles = LISTINGS.map((l) => l.model);
    const wipeListingIds = await tx
      .select({ id: listings.id })
      .from(listings)
      .where(
        and(inArray(listings.sellerId, chosenSellerIds), inArray(listings.title, dummyTitles)),
      );
    if (wipeListingIds.length > 0) {
      await tx.delete(listingDeals).where(
        inArray(
          listingDeals.listingId,
          wipeListingIds.map((r) => r.id),
        ),
      );
    }
    await tx.delete(listings).where(
      and(inArray(listings.sellerId, chosenSellerIds), inArray(listings.title, dummyTitles)),
    );

    const groups = splitEvenly([...LISTINGS], sellerRows.length);
    const interleaved = interleavedFromGroups(groups);
    const publishedAtForListing = publishedAtByListingRef(interleaved);

    const dealSeedTargets: {
      listingId: string;
      sellerId: string;
      buyerId: string;
      priceUsd: number;
      updatedAt: Date;
    }[] = [];

    for (let w = 0; w < sellerRows.length; w++) {
      const slice = groups[w]!;
      if (slice.length === 0) continue;
      const sellerId = sellerRows[w]!.id;
      const sellerOrbVerified = sellerRows[w]!.orbVerified;

      for (const l of slice) {
        const now = new Date();
        const publishedAt = publishedAtForListing.get(l);
        if (!publishedAt) {
          throw new Error(`Missing scheduled published_at for listing: ${l.model}`);
        }
        const [row] = await tx
          .insert(listings)
          .values({
            sellerId,
            status: 'active',
            title: l.model,
            teaser: teaserFrom(l.description),
            details: detailsFrom(l),
            priceUsd: l.price,
            condition: l.condition,
            modelNumber: null,
            caseSize: null,
            city: null,
            stateRegion: null,
            countryCode: null,
            orbVerifiedAtListing: sellerOrbVerified ? now : null,
            publishedAt,
            updatedAt: now,
          })
          .returning({ id: listings.id });

        if (!row) continue;

        if (l.photos.length > 0) {
          await tx.insert(listingPhotos).values(
            l.photos.map((url, i) => ({
              listingId: row.id,
              url,
              sortOrder: i,
            })),
          );
        }

        const commenterPool = allUserRows.map((r) => r.id).filter((id) => id !== sellerId);
        if (commenterPool.length >= 1) {
          const bodies = seedCommentBodies(l.model, l.condition);
          for (let ci = 0; ci < bodies.length; ci++) {
            const authorId = commenterPool[ci % commenterPool.length]!;
            const createdAt = new Date(publishedAt.getTime() - (ci + 1) * 45 * 60 * 1000);
            await tx.insert(listingComments).values({
              listingId: row.id,
              authorId,
              body: bodies[ci]!,
              createdAt,
              updatedAt: createdAt,
            });
          }
        }

        if (dealSeedTargets.length < 2 && commenterPool.length >= 1) {
          dealSeedTargets.push({
            listingId: row.id,
            sellerId,
            buyerId: commenterPool[0]!,
            priceUsd: l.price,
            updatedAt: now,
          });
        }
      }
    }

    for (const d of dealSeedTargets) {
      const [[sellerUser], [buyerUser]] = await Promise.all([
        tx.select().from(users).where(eq(users.id, d.sellerId)).limit(1),
        tx.select().from(users).where(eq(users.id, d.buyerId)).limit(1),
      ]);
      if (!sellerUser || !buyerUser) continue;

      const { settlement } = buildMockPublicProfileSoldParts({
        listingId: d.listingId,
        updatedAt: d.updatedAt,
        priceUsd: d.priceUsd,
      });
      const userOpHash = mockUserOpHashForListing({
        listingId: d.listingId,
        updatedAt: d.updatedAt,
        priceUsd: d.priceUsd,
      });
      const amountRaw =
        settlement.token === 'USDC'
          ? (BigInt(d.priceUsd) * BigInt(1_000_000)).toString()
          : (BigInt(d.priceUsd) * BigInt(10) ** BigInt(19) / BigInt(24)).toString();

      const confirmedAt = new Date();
      await tx.insert(listingDeals).values({
        listingId: d.listingId,
        sellerId: d.sellerId,
        buyerId: d.buyerId,
        status: 'confirmed',
        chainId: 480,
        chainName: settlement.chainName,
        userOpHash,
        transactionHash: settlement.txHash,
        blockNumber: settlement.blockNumber,
        fromAddress: buyerUser.walletAddress,
        toAddress: sellerUser.walletAddress,
        tokenContract: null,
        tokenSymbol: settlement.token,
        amountRaw,
        priceUsd: d.priceUsd,
        executedWith: 'mock',
        failureReason: null,
        confirmedAt,
        createdAt: confirmedAt,
        updatedAt: confirmedAt,
      });
      await tx
        .update(listings)
        .set({ status: 'sold', updatedAt: confirmedAt })
        .where(eq(listings.id, d.listingId));
    }
  });

  const [{ total }] =
    chosenSellerIds.length > 0
      ? await db
          .select({ total: sql<number>`count(*)::int` })
          .from(listings)
          .where(inArray(listings.sellerId, chosenSellerIds))
      : [{ total: 0 }];

  console.log(
    `Seed complete. ${total} listings across ${chosenSellerIds.length} seller(s) (by created_at, excluding ${EXCLUDED_SEED_LOGIN}); up to 2 mock listing_deals + sold rows. Legacy seed wallets removed if present.`,
  );
  await client.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
