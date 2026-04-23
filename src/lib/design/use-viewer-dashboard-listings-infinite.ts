'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ViewerDashboardResponse } from '@/lib/viewer/dashboard';
import { viewerDashboardRowToMyListing } from '@/lib/design/map-viewer-dashboard-to-my-listing';
import type { MyListing } from '@/lib/design/listing-store';
import { encodeSellerListingCursor } from '@/lib/viewer/dashboard-cursor';

import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

export function useViewerDashboardListingsInfinite(pageSize = 15) {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [listings, setListings] = useState<MyListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const reset = useCallback(() => {
    setListings([]);
    setHasMore(false);
    cursorRef.current = null;
    setError(null);
  }, []);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const params = new URLSearchParams();
      params.set('limit', String(pageSizeRef.current));
      if (cursor) params.set('cursor', cursor);
      const r = await fetch(`/api/design/viewer-dashboard?${params}`, {
        credentials: 'same-origin',
      });
      const j = (await r.json()) as ViewerDashboardResponse;
      if (!Array.isArray(j.listings)) {
        if (!append) setListings([]);
        setHasMore(false);
        return;
      }
      const mapped = j.listings.map(viewerDashboardRowToMyListing);
      setListings((prev) => (append ? [...prev, ...mapped] : mapped));
      const next = j.nextCursor;
      if (next) {
        cursorRef.current = encodeSellerListingCursor(next);
        setHasMore(true);
      } else {
        cursorRef.current = null;
        setHasMore(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!viewerId) {
      reset();
      return;
    }
    setIsLoading(true);
    setError(null);
    cursorRef.current = null;
    try {
      await fetchPage(null, false);
    } catch {
      setError('Failed to load listings');
      setListings([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [viewerId, fetchPage, reset]);

  useEffect(() => {
    if (!viewerId) {
      reset();
      return;
    }
    let cancelled = false;
    setListings([]);
    setIsLoading(true);
    setError(null);
    cursorRef.current = null;
    fetchPage(null, false)
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load listings');
          setListings([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewerId, fetchPage, reset]);

  const loadMore = useCallback(async () => {
    if (!viewerId || !hasMore || isLoadingMore || !cursorRef.current) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      await fetchPage(cursorRef.current, true);
    } catch {
      setError('Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  }, [viewerId, hasMore, isLoadingMore, fetchPage]);

  return {
    listings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}
