import { useEffect, useState } from "react";

/**
 * Keeps the last non-null value of `value` mounted long enough for a drawer /
 * sheet exit animation to play. When the parent flips its state to `null` to
 * close the drawer, both the `open` prop and the source value typically reset
 * on the same render — which would unmount the drawer instantly and skip the
 * close animation. This hook caches the previous value for `delayMs` after the
 * source value goes null so the drawer can finish animating.
 *
 * Usage:
 *   const resident = useDrawerResident(listing);
 *   if (!resident) return null;
 *   return <Sheet open={listing != null} ...><Content listing={resident} /></Sheet>;
 */
export function useDrawerResident<T>(value: T | null | undefined, delayMs = 600): T | null {
  const [resident, setResident] = useState<T | null>(value ?? null);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setResident(value);
      return;
    }
    const timer = window.setTimeout(() => setResident(null), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return resident;
}
