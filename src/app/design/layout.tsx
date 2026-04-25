import type { ReactNode } from 'react';

import { DesignAppShell } from '@/components/design/DesignAppShell';
import { DesignEngagementProvider } from '@/lib/design/use-design-engagement';
import { DesignListingSavesProvider } from '@/lib/design/use-design-listing-saves';
import { DesignViewerProvider } from '@/lib/design/DesignViewerProvider';
import { RouteModeProvider } from '@/lib/route-mode/RouteModeProvider';
import { resolveDesignViewer } from '@/lib/server/resolve-design-viewer-user-id';
import { dbUserRowToAppViewer } from '@/lib/viewer/from-db-user';

/**
 * Public UX sandbox for browser-only iteration (no World App / tunnel / sign-in).
 * Jae merges these layouts into (protected) routes when wiring real auth & MiniKit.
 */
export default async function DesignLayout({ children }: { children: ReactNode }) {
  const viewerRow = await resolveDesignViewer('sandbox');
  const initialViewer = viewerRow ? dbUserRowToAppViewer(viewerRow) : null;

  return (
    <RouteModeProvider basePath="/design" isSandbox>
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
