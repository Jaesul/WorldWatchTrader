import type { DefaultSession, NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface User {
    walletAddress: string;
    username: string;
    profilePictureUrl: string;
  }

  interface Session {
    user: {
      walletAddress: string;
      username: string;
      profilePictureUrl: string;
    } & DefaultSession['user'];
  }
}

/**
 * Shared Auth.js config (JWT callbacks, trustHost, secret).
 * Used by the full `NextAuth` instance in `src/auth/index.ts`.
 *
 * We intentionally do **not** mount `NextAuth(...).auth` as Next.js middleware:
 * Vercel Edge still bundles `next-auth` there and can flag unsupported Node APIs.
 * Use `auth()` from `@/auth` in layouts / route handlers for session checks.
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.address as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
      }

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
