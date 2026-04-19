import NextAuth from 'next-auth';

import { authConfig } from '@/auth/auth.config';

/**
 * Edge-safe: only `auth.config` is imported here (no MiniKit / SIWE / Node crypto).
 * @see https://authjs.dev/guides/edge-compatibility
 */
export default NextAuth(authConfig).auth;
