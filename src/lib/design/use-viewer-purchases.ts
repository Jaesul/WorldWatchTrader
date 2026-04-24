'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ViewerDashboardListingJson } from '@/lib/viewer/dashboard';
import { viewerDashboardRowToMyListing } from '@/lib/design/map-viewer-dashboard-to-my-listing';
import type { MyListing } from '@/lib/design/listing-store';

import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

type PurchasesState = {
  purchases: MyListing[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/** DB-backed confirmed purchases for the current design viewer. */
export function useViewerPurchases(): PurchasesState {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [purchases, setPurchases] = useState<MyListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!viewerId) {
      setPurchases([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/design/purchases', {
        credentials: 'same-origin',
      });
      const j = (await r.json()) as { listings?: ViewerDashboardListingJson[] };
      const list = Array.isArray(j.listings) ? j.listings : [];
      setPurchases(list.map(viewerDashboardRowToMyListing));
    } catch {
      setError('Failed to load purchases');
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { purchases, isLoading, error, refresh: load };
}
