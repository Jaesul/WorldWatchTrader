/** Matches seed exclusion in `src/db/seed-listings.ts` (`EXCLUDED_SEED_LOGIN`). */
const EXCLUDED_LOGIN = 'ajemian.2718';

function isExcludedPublicProfileUser(username: string, handle: string | null) {
  const u = username.trim().toLowerCase();
  const h = (handle ?? '').trim().toLowerCase();
  return u === EXCLUDED_LOGIN || h === EXCLUDED_LOGIN;
}

export function publicProfileSalesAndPositivePercent(input: {
  username: string;
  handle: string | null;
  soldCountFromDb: number;
  totalReviews: number;
  positiveReviews: number;
}): { sales: number; positiveRate: number } {
  if (isExcludedPublicProfileUser(input.username, input.handle)) {
    return { sales: 0, positiveRate: 0 };
  }
  const positiveRate =
    input.totalReviews > 0
      ? Math.round((input.positiveReviews / input.totalReviews) * 100)
      : 0;
  return {
    sales: input.soldCountFromDb,
    positiveRate,
  };
}

export function profileDisplayName(user: {
  username: string;
  handle: string | null;
  id: string;
}): string {
  if (user.username.trim()) return user.username.trim();
  if (user.handle?.trim()) return user.handle.trim();
  const id = user.id;
  const raw = id.replace(/^0x/i, '');
  if (raw.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function memberSinceLabel(createdAt: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(createdAt);
}
