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
  if (!info || typeof info !== 'object') {
    return false;
  }

  const v = (info as WorldUserInfoPayload).verificationStatus;
  return Boolean(v?.isOrbVerified);
}
