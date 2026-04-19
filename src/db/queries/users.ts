import { eq } from 'drizzle-orm';

import { getDb, users } from '@/db';

export type UpsertUserInput = {
  id: string;
  walletAddress: string;
  username: string;
  profilePictureUrl?: string | null;
  handle?: string | null;
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
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        walletAddress: input.walletAddress,
        username: input.username ?? '',
        profilePictureUrl: input.profilePictureUrl ?? null,
        ...(input.handle !== undefined ? { handle: input.handle } : {}),
        updatedAt: now,
      },
    });
}

export async function getUserById(id: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

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
