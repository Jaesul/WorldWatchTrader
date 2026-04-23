import type { ReactNode } from 'react';

import { DesignNav } from '@/components/design/DesignNav';
import { SoldLuxuryCelebrationLayer } from '@/components/design/SoldLuxuryCelebrationLayer';
import { Toaster } from '@/components/ui/sonner';
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
      <div className="flex h-dvh flex-col bg-background">
        <header className="border-b border-border bg-background px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">World Watch Trader</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <DesignNav />
        <SoldLuxuryCelebrationLayer />
        <Toaster position="bottom-center" />
      </div>
      </DesignEngagementProvider>
      </DesignListingSavesProvider>
    </DesignViewerProvider>
  );
}
