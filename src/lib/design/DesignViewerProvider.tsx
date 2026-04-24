'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import type { AppViewer } from '@/lib/viewer/types';

type DesignViewerContextValue = {
  viewer: AppViewer | null;
  allViewers: AppViewer[];
  allViewersLoading: boolean;
  ensureAllViewersLoaded: () => Promise<void>;
  setViewerId: (userId: string) => Promise<void>;
  clearViewer: () => Promise<void>;
};

const DesignViewerContext = createContext<DesignViewerContextValue | null>(null);

export function DesignViewerProvider({
  children,
  initialViewer,
  initialViewers = [],
}: {
  children: ReactNode;
  initialViewer: AppViewer | null;
  /** When empty, users are loaded client-side so the design layout does not block on `listUsersForPicker`. */
  initialViewers?: AppViewer[];
}) {
  const router = useRouter();
  const [allViewers, setAllViewers] = useState<AppViewer[]>(initialViewers);
  const [allViewersLoading, setAllViewersLoading] = useState(false);

  useEffect(() => {
    if (initialViewers.length > 0) setAllViewers(initialViewers);
  }, [initialViewers]);

  const ensureAllViewersLoaded = useCallback(async () => {
    if (initialViewers.length > 0 || allViewers.length > 0 || allViewersLoading) return;
    setAllViewersLoading(true);
    try {
      const res = await fetch('/api/design/users-for-picker');
      if (!res.ok) return;
      const data = (await res.json()) as AppViewer[];
      setAllViewers(data);
    } catch {
      /* ignore */
    } finally {
      setAllViewersLoading(false);
    }
  }, [allViewers.length, allViewersLoading, initialViewers.length]);

  const setViewerId = useCallback(async (userId: string) => {
    const res = await fetch('/api/design/viewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      console.error('setViewerId failed', await res.text());
      return;
    }
    router.refresh();
  }, [router]);

  const clearViewer = useCallback(async () => {
    await fetch('/api/design/viewer', { method: 'DELETE' });
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      viewer: initialViewer,
      allViewers,
      allViewersLoading,
      ensureAllViewersLoaded,
      setViewerId,
      clearViewer,
    }),
    [
      initialViewer,
      allViewers,
      allViewersLoading,
      ensureAllViewersLoaded,
      setViewerId,
      clearViewer,
    ],
  );

  return <DesignViewerContext.Provider value={value}>{children}</DesignViewerContext.Provider>;
}

export function useDesignViewer(): DesignViewerContextValue {
  const ctx = useContext(DesignViewerContext);
  if (!ctx) {
    throw new Error('useDesignViewer must be used under DesignViewerProvider');
  }
  return ctx;
}
