import { asc, eq, or, sql } from 'drizzle-orm';

import { getDb, users } from '@/db';

export type UpsertUserInput = {
  id: string;
  walletAddress: string;
  username: string;
  profilePictureUrl?: string | null;
  handle?: string | null;
  orbVerified: boolean;
  /** Set when orb-verified; keep prior timestamp when re-logging in still verified. */
  verifiedAt: Date | null;
};

export async function upsertUserFromSession(input: UpsertUserInput) {
  const db = getDb();
  const now = new Date();

  await db
    .insert(users)
    .values({
      id: input.id,
      walletAddress: input.walletAddress,
      username: input.username ?? '',
      profilePictureUrl: input.profilePictureUrl ?? null,
      handle: input.handle ?? null,
      orbVerified: input.orbVerified,
      verifiedAt: input.verifiedAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        walletAddress: input.walletAddress,
        username: input.username ?? '',
        profilePictureUrl: input.profilePictureUrl ?? null,
        ...(input.handle !== undefined ? { handle: input.handle } : {}),
        orbVerified: input.orbVerified,
        verifiedAt: input.verifiedAt,
        updatedAt: now,
      },
    });
}

export async function getUserById(id: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

const USER_SLUG_RE = /^user_([0-9a-f]{10})$/i;

/**
 * Resolve `/design/u/[handle]` slug to a user: explicit `handle`, `username`, or
 * synthetic `user_${first10HexOfWalletId}` (same rule as feed `sellerHandle()`).
 */
export async function getUserByPublicProfileSlug(slug: string) {
  const raw = slug.trim();
  if (!raw) return null;

  const db = getDb();

  const m = USER_SLUG_RE.exec(raw);
  if (m) {
    const prefix = m[1]!.toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(replace(${users.id}, '0x', '')) like ${prefix + '%'}`)
      .orderBy(users.id)
      .limit(2);
    if (rows.length === 1) return rows[0]!;
    if (rows.length > 1) {
      const exact = rows.find(
        (u) => u.id.replace(/^0x/i, '').toLowerCase().startsWith(prefix),
      );
      return exact ?? rows[0]!;
    }
  }

  const lower = raw.toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(
      or(
        sql`lower(${users.handle}) = ${lower}`,
        sql`lower(${users.username}) = ${lower}`,
      )!,
    )
    .limit(1);
  return rows[0] ?? null;
}

/** All users for the `/design` viewer picker (stable order). */
export async function listUsersForPicker() {
  const db = getDb();
  return db
    .select({
      id: users.id,
      walletAddress: users.walletAddress,
      username: users.username,
      handle: users.handle,
      profilePictureUrl: users.profilePictureUrl,
      orbVerified: users.orbVerified,
      powerSeller: users.powerSeller,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));
}

/** Primary-key–cheap default viewer for design APIs (avoid `listUsersForPicker` on every request). */
export async function getDefaultDesignViewerUserId(): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function getDefaultDesignViewer() {
  const db = getDb();
  const rows = await db.select().from(users).orderBy(asc(users.createdAt)).limit(1);
  return rows[0] ?? null;
}

export type UserPickerRow = Awaited<ReturnType<typeof listUsersForPicker>>[number];

export type PatchUserInput = {
  username?: string;
  profilePictureUrl?: string | null;
  handle?: string | null;
  orbVerified?: boolean;
  verifiedAt?: Date | null;
};

export async function updateUserProfile(userId: string, patch: PatchUserInput) {
  const db = getDb();
  const now = new Date();
  const filtered = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as PatchUserInput;
  if (Object.keys(filtered).length === 0) {
    return getUserById(userId);
  }
  const [row] = await db
    .update(users)
    .set({ ...filtered, updatedAt: now })
    .where(eq(users.id, userId))
    .returning();
  return row ?? null;
}
