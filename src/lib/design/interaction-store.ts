/**
 * Module-level store for likes and saves in the design sandbox.
 * Saves persist to localStorage and sync across tabs via subscribe().
 */

const STORAGE_KEY = 'wwt-design-saved-listing-ids';

const likedIds = new Set<string>();
const savedIds = new Set<string>();

const listeners = new Set<() => void>();

let hydrated = false;

function applySavedIdsFromJson(raw: string | null): void {
  savedIds.clear();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    for (const id of parsed) {
      if (typeof id === 'string') savedIds.add(id);
    }
  } catch {
    /* ignore */
  }
}

function attachCrossTabSync(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    applySavedIdsFromJson(e.newValue);
    notifySaved();
  });
}

function hydrateSavedFromStorage(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  attachCrossTabSync();
  try {
    applySavedIdsFromJson(localStorage.getItem(STORAGE_KEY));
  } catch {
    /* ignore corrupt storage */
  }
}

function persistSaved(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
  } catch {
    /* quota / private mode */
  }
}

function notifySaved(): void {
  for (const l of listeners) l();
}

// ── Likes (in-memory only, design prototype) ────────────────────────────────

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

// ── Saves (persisted) ─────────────────────────────────────────────────────

export function subscribeSaved(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Stable string for useSyncExternalStore — sorted ids joined by comma */
export function getSavedSnapshot(): string {
  hydrateSavedFromStorage();
  return [...savedIds].sort().join(',');
}

export function getServerSavedSnapshot(): string {
  return '';
}

export function isSaved(id: string): boolean {
  hydrateSavedFromStorage();
  return savedIds.has(id);
}

export function toggleSave(id: string): boolean {
  hydrateSavedFromStorage();
  let saved: boolean;
  if (savedIds.has(id)) {
    savedIds.delete(id);
    saved = false;
  } else {
    savedIds.add(id);
    saved = true;
  }
  persistSaved();
  notifySaved();
  return saved;
}

export function getSavedIds(): ReadonlySet<string> {
  hydrateSavedFromStorage();
  return savedIds;
}
