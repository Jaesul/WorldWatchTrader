'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  getSavedSnapshot,
  getServerSavedSnapshot,
  subscribeSaved,
} from '@/lib/design/interaction-store';

/** Re-renders when saved listings change (any route, same tab). Backed by localStorage. */
export function useSavedIds(): Set<string> {
  const key = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getServerSavedSnapshot);
  return useMemo(() => new Set(key ? key.split(',') : []), [key]);
}
