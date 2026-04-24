import { hashNonce } from '@/auth/wallet/client-helpers';
import { getUserById, upsertUserFromSession } from '@/db/queries/users';
import { isOrbVerifiedFromUserInfo } from '@/lib/world-user-info';
import { MiniKit } from '@worldcoin/minikit-js';
import type { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js/commands';
import { verifySiweMessage } from '@worldcoin/minikit-js/siwe';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    walletAddress: string;
    username: string;
    profilePictureUrl: string;
    orbVerified: boolean;
  }

  interface Session {
    user: {
      walletAddress: string;
      username: string;
      profilePictureUrl: string;
      orbVerified: boolean;
    } & DefaultSession['user'];
  }
}

// Auth configuration for Wallet Auth based sessions
// For more information on each option (and a full list of options) go to
// https://authjs.dev/getting-started/authentication/credentials
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Required for dev (e.g. https localhost, custom port, ngrok) and some proxies — see https://errors.authjs.dev#untrustedhost
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      // @ts-expect-error TODO
      authorize: async ({
        nonce,
        signedNonce,
        finalPayloadJson,
      }: {
        nonce: string;
        signedNonce: string;
        finalPayloadJson: string;
      }) => {
        const expectedSignedNonce = hashNonce({ nonce });

        if (signedNonce !== expectedSignedNonce) {
          console.log('Invalid signed nonce');
          return null;
        }

        const finalPayload: MiniAppWalletAuthSuccessPayload =
          JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);

        if (!result.isValid || !result.siweMessageData.address) {
          console.log('Invalid final payload');
          return null;
        }
        // Optionally, fetch the user info from your own database
        const userInfo = await MiniKit.getUserInfo(finalPayload.address);
        const walletAddress = userInfo.walletAddress ?? finalPayload.address;
        const sessionOrbVerified = isOrbVerifiedFromUserInfo(userInfo);
        const existing = await getUserById(finalPayload.address);
        const dbOrbVerified = existing?.orbVerified ?? false;
        const orbVerified = dbOrbVerified || sessionOrbVerified;
        const verifiedAt = existing?.verifiedAt ?? null;

        await upsertUserFromSession({
          id: finalPayload.address,
          walletAddress,
          username: userInfo.username ?? '',
          profilePictureUrl: userInfo.profilePictureUrl,
          orbVerified,
          verifiedAt,
        });

        return {
          id: finalPayload.address,
          ...userInfo,
          orbVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
        token.orbVerified = user.orbVerified;
      }
      if (token.userId && token.orbVerified !== true) {
        const row = await getUserById(token.userId as string);
        if (row) token.orbVerified = row.orbVerified;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
        session.user.orbVerified = Boolean(token.orbVerified);
      }

      return session;
    },
  },
});
