import { getCachedSession } from '@/lib/auth/get-session';
import ClientProviders from '@/providers';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCachedSession();
  return <ClientProviders session={session}>{children}</ClientProviders>;
}
