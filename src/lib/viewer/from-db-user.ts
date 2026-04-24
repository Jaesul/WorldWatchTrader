import type { users } from '@/db/schema';

import type { AppViewer } from './types';

type UserRow = typeof users.$inferSelect;

/** Any row that includes the columns `AppViewer` needs (e.g. full `users` row or `UserPickerRow`). */
export type DbUserLikeForViewer = Pick<
  UserRow,
  | 'id'
  | 'walletAddress'
  | 'username'
  | 'handle'
  | 'profilePictureUrl'
  | 'bio'
  | 'orbVerified'
  | 'powerSeller'
  | 'createdAt'
>;

export function dbUserRowToAppViewer(row: DbUserLikeForViewer): AppViewer {
  return {
    id: row.id,
    walletAddress: row.walletAddress,
    username: row.username,
    profilePictureUrl: row.profilePictureUrl ?? null,
    bio: row.bio ?? '',
    handle: row.handle ?? null,
    orbVerified: row.orbVerified,
    powerSeller: row.powerSeller,
    memberSinceMs: row.createdAt.getTime(),
  };
}
