'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  getListingsSnapshot,
  getServerListingsSnapshot,
  subscribeListings,
  type MyListing,
} from '@/lib/design/listing-store';

/** Re-renders when the user's listings change. Backed by localStorage. */
export function useMyListings(): MyListing[] {
  const snapshot = useSyncExternalStore(
    subscribeListings,
    getListingsSnapshot,
    getServerListingsSnapshot,
  );
  return useMemo(() => {
    try {
      return JSON.parse(snapshot) as MyListing[];
    } catch {
      return [];
    }
  }, [snapshot]);
}
