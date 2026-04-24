"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  subscribeProfile,
  type DesignProfile,
} from "@/lib/design/profile-store";

export function useDesignProfile(): DesignProfile {
  const snapshot = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  return useMemo(() => {
    try {
      return JSON.parse(snapshot) as DesignProfile;
    } catch {
      return JSON.parse(getServerProfileSnapshot()) as DesignProfile;
    }
  }, [snapshot]);
}
