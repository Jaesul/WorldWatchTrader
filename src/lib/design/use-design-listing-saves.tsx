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
import { useRouteMode } from '@/lib/route-mode/RouteModeProvider';

type ListingSavesResponse = {
  listingIds: string[];
  listings: DesignFeedListing[];
};

async function fetchListingSaves(includeListings = false): Promise<ListingSavesResponse> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(
      includeListings
        ? '/api/design/listing-saves?includeListings=1'
        : '/api/design/listing-saves',
      {
      signal: controller.signal,
      },
    );
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
  savedListingsLoaded: boolean;
  ensureSavedIdsLoaded: () => Promise<void>;
  ensureSavedListingsLoaded: () => Promise<void>;
  refresh: () => void;
  toggleSave: (listingId: string) => Promise<void>;
};

const DesignListingSavesContext =
  createContext<DesignListingSavesContextValue | null>(null);

export function DesignListingSavesProvider({ children }: { children: ReactNode }) {
  const { isSandbox } = useRouteMode();
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const savedIdsRef = useRef(savedIds);
  savedIdsRef.current = savedIds;
  const [savedListings, setSavedListings] = useState<DesignFeedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIdsLoaded, setSavedIdsLoaded] = useState(false);
  const [savedListingsLoaded, setSavedListingsLoaded] = useState(false);

  const loadSaves = useCallback(async (showLoading: boolean, includeListings: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchListingSaves(includeListings);
      setSavedIds(new Set(data.listingIds));
      if (includeListings) {
        setSavedListings(data.listings);
        setSavedListingsLoaded(true);
      }
      setSavedIdsLoaded(true);
    } catch {
      toast.error('Could not load saved listings');
      setSavedIds(new Set());
      if (includeListings) {
        setSavedListings([]);
        setSavedListingsLoaded(false);
      }
      setSavedIdsLoaded(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSavedIds(new Set());
    setSavedListings([]);
    setSavedIdsLoaded(false);
    setSavedListingsLoaded(false);
    setLoading(false);
  }, [viewerId]);

  const ensureSavedIdsLoaded = useCallback(async () => {
    if (savedIdsLoaded) return;
    await loadSaves(false, false);
  }, [loadSaves, savedIdsLoaded]);

  const ensureSavedListingsLoaded = useCallback(async () => {
    if (savedListingsLoaded) return;
    await loadSaves(true, true);
  }, [loadSaves, savedListingsLoaded]);

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (!viewerId) {
        toast.info(
          isSandbox
            ? 'Pick a user in the design sandbox picker to save listings.'
            : 'Sign in to save listings.',
        );
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
        await loadSaves(false, savedListingsLoaded);
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
    [viewerId, isSandbox, loadSaves, savedListingsLoaded],
  );

  const refresh = useCallback(() => {
    void loadSaves(false, savedListingsLoaded);
  }, [loadSaves, savedListingsLoaded]);

  const value = useMemo(
    () => ({
      savedIds,
      savedListings,
      loading,
      savedListingsLoaded,
      ensureSavedIdsLoaded,
      ensureSavedListingsLoaded,
      refresh,
      toggleSave,
    }),
    [
      savedIds,
      savedListings,
      loading,
      savedListingsLoaded,
      ensureSavedIdsLoaded,
      ensureSavedListingsLoaded,
      refresh,
      toggleSave,
    ],
  );

  return (
    <DesignListingSavesContext.Provider value={value}>
      {children}
    </DesignListingSavesContext.Provider>
  );
}

/**
 * DB-backed bookmarks. On `/design`, keyed to the sandbox viewer cookie; on base
 * routes, keyed to the signed-in user (see `/api/design/listing-saves` + Referer).
 * Must be used under {@link DesignListingSavesProvider} (in both app shells).
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
