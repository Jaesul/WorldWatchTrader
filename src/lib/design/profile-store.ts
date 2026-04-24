/**
 * Design sandbox profile (bio + avatar). Persists to localStorage.
 */

const STORAGE_KEY = "wwt-design-profile";

export type DesignProfile = {
  bio: string;
  /** Image URL or data URL from upload / camera. */
  avatarUrl: string;
};

const DEFAULT_PROFILE: DesignProfile = {
  bio: "Collector focused on vintage Rolex and modern sports watches. Based in NYC. Fast shipper.",
  avatarUrl: "https://i.pravatar.cc/150?u=me-user",
};

let profile: DesignProfile = { ...DEFAULT_PROFILE };
const listeners = new Set<() => void>();
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DesignProfile>;
      profile = {
        bio: typeof parsed.bio === "string" ? parsed.bio : DEFAULT_PROFILE.bio,
        avatarUrl:
          typeof parsed.avatarUrl === "string"
            ? parsed.avatarUrl
            : DEFAULT_PROFILE.avatarUrl,
      };
    }
  } catch {
    profile = { ...DEFAULT_PROFILE };
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* quota */
  }
}

function notify(): void {
  for (const l of listeners) l();
}

export function subscribeProfile(onStoreChange: () => void): () => void {
  hydrate();
  listeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        profile = e.newValue
          ? (JSON.parse(e.newValue) as DesignProfile)
          : { ...DEFAULT_PROFILE };
      } catch {
        profile = { ...DEFAULT_PROFILE };
      }
      notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(onStoreChange);
}

export function getProfileSnapshot(): string {
  hydrate();
  return JSON.stringify(profile);
}

export function getServerProfileSnapshot(): string {
  return JSON.stringify(DEFAULT_PROFILE);
}

export function getDesignProfile(): DesignProfile {
  hydrate();
  return { ...profile };
}

export function updateDesignProfile(updates: Partial<DesignProfile>): void {
  hydrate();
  profile = { ...profile, ...updates };
  persist();
  notify();
}
