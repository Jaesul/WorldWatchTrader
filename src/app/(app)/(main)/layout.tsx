import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { DesignAppShell } from '@/components/design/DesignAppShell';
import { getUserById } from '@/db/queries/users';
import { getCachedSession } from '@/lib/auth/get-session';
import { DesignEngagementProvider } from '@/lib/design/use-design-engagement';
import { DesignListingSavesProvider } from '@/lib/design/use-design-listing-saves';
import { DesignViewerProvider } from '@/lib/design/DesignViewerProvider';
import { RouteModeProvider } from '@/lib/route-mode/RouteModeProvider';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';

/**
 * Auth-gated shell for the real app. Mirrors `/design/layout.tsx` but seeds
 * the viewer from the NextAuth session (no cookie picker) and redirects to
 * `/welcome` when the user is not signed in or their session row no longer
 * exists in the DB.
 */
export default async function MainAppLayout({ children }: { children: ReactNode }) {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect('/welcome');

  const userRow = await getUserById(session.user.id);
  if (!userRow) redirect('/welcome');

  const initialViewer = dbUserRowToAppViewer(userRow);

  return (
    <RouteModeProvider basePath="" isSandbox={false}>
      <DesignViewerProvider initialViewer={initialViewer} initialViewers={[]}>
        <DesignListingSavesProvider>
          <DesignEngagementProvider>
            <DesignAppShell>{children}</DesignAppShell>
          </DesignEngagementProvider>
        </DesignListingSavesProvider>
      </DesignViewerProvider>
    </RouteModeProvider>
  );
}
