/**
 * `MiniKit.getUserInfo` is typed narrowly in minikit-js, but World App can include a
 * `verificationStatus` object (same shape as `MiniKit.user` / SDK `User` in the kit typings).
 */
export type WorldUserInfoPayload = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  verificationStatus?: {
    isOrbVerified?: boolean;
    isDocumentVerified?: boolean;
    isSecureDocumentVerified?: boolean;
  };
};

export function isOrbVerifiedFromUserInfo(info: unknown): boolean {
  console.log(
    '[world-user-info] raw input',
    JSON.stringify(info, null, 2),
  );

  if (!info || typeof info !== 'object') {
    console.log('[world-user-info] input is not an object');
    return false;
  }

  console.log(
    '[world-user-info] top-level keys',
    Object.keys(info as Record<string, unknown>),
  );

  const v = (info as WorldUserInfoPayload).verificationStatus;
  console.log('[world-user-info] verificationStatus field', v);
  console.log('[world-user-info] isOrbVerified field', v?.isOrbVerified);

  return Boolean(v?.isOrbVerified);
}
