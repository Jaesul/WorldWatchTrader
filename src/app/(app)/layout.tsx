import { auth } from '@/auth';
import ClientProviders from '@/providers';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return <ClientProviders session={session}>{children}</ClientProviders>;
}
