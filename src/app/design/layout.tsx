import type { ReactNode } from 'react';

import { DesignAppShell } from '@/components/design/DesignAppShell';
import { getUserById } from '@/db/queries/users';
import { DesignEngagementProvider } from '@/lib/design/use-design-engagement';
import { DesignListingSavesProvider } from '@/lib/design/use-design-listing-saves';
import { DesignViewerProvider } from '@/lib/design/DesignViewerProvider';
import { resolveDesignViewerUserId } from '@/lib/server/resolve-design-viewer-user-id';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default async function DesignLayout({ children }: { children: ReactNode }) {
  const viewerId = await resolveDesignViewerUserId();
  const viewerRow = viewerId ? await getUserById(viewerId) : null;
  const initialViewer = viewerRow ? dbUserRowToAppViewer(viewerRow) : null;

  return (
    <DesignViewerProvider initialViewer={initialViewer} initialViewers={[]}>
      <DesignListingSavesProvider>
      <DesignEngagementProvider>
        <DesignAppShell>{children}</DesignAppShell>
      </DesignEngagementProvider>
      </DesignListingSavesProvider>
    </DesignViewerProvider>
  );
}
