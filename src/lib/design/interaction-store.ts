/**
 * Module-level store for likes and saves in the design sandbox.
 * Persists across client-side navigations within a session (resets on hard refresh).
 */

const likedIds = new Set<string>();
const savedIds = new Set<string>();

// ── Likes ──────────────────────────────────────────────────────────────────

export function isLiked(id: string): boolean {
  return likedIds.has(id);
}

export function toggleLike(id: string): boolean {
  if (likedIds.has(id)) {
    likedIds.delete(id);
    return false;
  }
  likedIds.add(id);
  return true;
}

export function getLikedIds(): ReadonlySet<string> {
  return likedIds;
}

// ── Saves ──────────────────────────────────────────────────────────────────

export function isSaved(id: string): boolean {
  return savedIds.has(id);
}

export function toggleSave(id: string): boolean {
  if (savedIds.has(id)) {
    savedIds.delete(id);
    return false;
  }
  savedIds.add(id);
  return true;
}

export function getSavedIds(): ReadonlySet<string> {
  return savedIds;
}
