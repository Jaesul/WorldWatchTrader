"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getLikedSnapshot,
  getServerLikedSnapshot,
  subscribeLiked,
} from "@/lib/design/interaction-store";

/** Re-renders when liked listings change (same tab, in-memory). */
export function useLikedIds(): Set<string> {
  const key = useSyncExternalStore(
    subscribeLiked,
    getLikedSnapshot,
    getServerLikedSnapshot,
  );
  return useMemo(() => new Set(key ? key.split(",") : []), [key]);
}
