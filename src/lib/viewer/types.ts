/**
 * Session-shaped viewer for UI — map from DB `users` today, from NextAuth `Session` later.
 * Keep serializable for RSC → client props (use ms timestamps, not `Date`).
 */
export type AppViewer = {
  id: string;
  walletAddress: string;
  username: string;
  profilePictureUrl: string | null;
  bio: string;
  handle: string | null;
  orbVerified: boolean;
  powerSeller: boolean;
  /** `users.created_at` as epoch ms */
  memberSinceMs: number;
};
