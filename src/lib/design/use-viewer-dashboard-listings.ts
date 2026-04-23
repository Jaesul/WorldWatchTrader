'use client';

import { useEffect, useState } from 'react';

import type { ViewerDashboardResponse } from '@/lib/viewer/dashboard';
import { viewerDashboardRowToMyListing } from '@/lib/design/map-viewer-dashboard-to-my-listing';
import type { MyListing } from '@/lib/design/listing-store';

import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

/** DB-backed “my listings” for the selected design viewer (same cookie as profile). */
export function useViewerDashboardListings(): MyListing[] {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [listings, setListings] = useState<MyListing[]>([]);

  useEffect(() => {
    if (!viewerId) {
      setListings([]);
      return;
    }
    let cancelled = false;
    fetch('/api/design/viewer-dashboard?limit=100', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j: ViewerDashboardResponse) => {
        if (cancelled || !j.listings) return;
        setListings(j.listings.map(viewerDashboardRowToMyListing));
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  return listings;
}
