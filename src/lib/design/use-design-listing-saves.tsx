'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { useDesignViewer } from '@/lib/design/DesignViewerProvider';
import type { DesignFeedListing } from '@/lib/design/map-db-feed-to-listing';

type ListingSavesResponse = {
  listingIds: string[];
  listings: DesignFeedListing[];
};

async function fetchListingSaves(): Promise<ListingSavesResponse> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch('/api/design/listing-saves', {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('fetch failed');
    return (await res.json()) as ListingSavesResponse;
  } finally {
    window.clearTimeout(t);
  }
}

type DesignListingSavesContextValue = {
  savedIds: Set<string>;
  savedListings: DesignFeedListing[];
  loading: boolean;
  refresh: () => void;
  toggleSave: (listingId: string) => Promise<void>;
};

const DesignListingSavesContext =
  createContext<DesignListingSavesContextValue | null>(null);

export function DesignListingSavesProvider({ children }: { children: ReactNode }) {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const savedIdsRef = useRef(savedIds);
  savedIdsRef.current = savedIds;
  const [savedListings, setSavedListings] = useState<DesignFeedListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaves = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchListingSaves();
      setSavedIds(new Set(data.listingIds));
      setSavedListings(data.listings);
    } catch {
      toast.error('Could not load saved listings');
      setSavedIds(new Set());
      setSavedListings([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSaves(true);
  }, [loadSaves, viewer?.id]);

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (!viewerId) {
        toast.info('Pick a profile user in Design to save listings.');
        return;
      }
      const wasSaved = savedIdsRef.current.has(listingId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        const res = wasSaved
          ? await fetch(
              `/api/design/listing-saves?listingId=${encodeURIComponent(listingId)}`,
              { method: 'DELETE' },
            )
          : await fetch('/api/design/listing-saves', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listingId }),
            });
        if (!res.ok) throw new Error('request failed');
        await loadSaves(false);
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        toast.error(wasSaved ? 'Could not remove save' : 'Could not save listing');
      }
    },
    [viewerId, loadSaves],
  );

  const refresh = useCallback(() => {
    void loadSaves(false);
  }, [loadSaves]);

  const value = useMemo(
    () => ({
      savedIds,
      savedListings,
      loading,
      refresh,
      toggleSave,
    }),
    [savedIds, savedListings, loading, refresh, toggleSave],
  );

  return (
    <DesignListingSavesContext.Provider value={value}>
      {children}
    </DesignListingSavesContext.Provider>
  );
}

/**
 * DB-backed bookmarks for the design sandbox, keyed to the selected design viewer (cookie).
 * Must be used under {@link DesignListingSavesProvider} (wrapped in `design/layout.tsx`).
 */
export function useDesignListingSaves(): DesignListingSavesContextValue {
  const ctx = useContext(DesignListingSavesContext);
  if (!ctx) {
    throw new Error(
      'useDesignListingSaves must be used under DesignListingSavesProvider',
    );
  }
  return ctx;
}
