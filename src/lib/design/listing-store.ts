/**
 * Module-level store for the current user's listings in the design sandbox.
 * Persists to localStorage and syncs across tabs via subscribe().
 */

const STORAGE_KEY = 'wwt-design-my-listings';

// Unsplash photo pool — same set used by the feed
const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1611243705491-71487c2ed137?auto=format&fit=crop&w=800&q=80', // Rolex Sub
  'https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=800&q=80', // Rolex DJ
  'https://images.unsplash.com/photo-1605101232508-283d0cd4909e?auto=format&fit=crop&w=800&q=80', // Rolex GMT
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80', // Omega Speed
  'https://images.unsplash.com/photo-1556453007-ee036169934b?auto=format&fit=crop&w=800&q=80', // Omega Sea
  'https://images.unsplash.com/photo-1617714651073-17a0fcd14f9e?auto=format&fit=crop&w=800&q=80', // AP RO
  'https://images.unsplash.com/photo-1615029530759-79e0ca82371a?auto=format&fit=crop&w=800&q=80', // AP Offshore
  'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80', // Patek Nautilus
  'https://images.unsplash.com/photo-1677445166019-4fa91a090e49?auto=format&fit=crop&w=800&q=80', // Cartier
  'https://images.unsplash.com/photo-1670404160620-a3a86428560e?auto=format&fit=crop&w=800&q=80', // Tudor
  'https://images.unsplash.com/photo-1674208884812-cdc0b4bc1cf0?auto=format&fit=crop&w=800&q=80', // Grand Seiko
] as const;

let photoPoolIndex = 0;
function nextPhoto(): string {
  const photo = PHOTO_POOL[photoPoolIndex % PHOTO_POOL.length];
  photoPoolIndex++;
  return photo;
}

export type ListingStatus = 'draft' | 'active' | 'pending' | 'sold' | 'archived';

export interface MyListing {
  id: string;
  model: string;
  price: number;
  currency: string;
  description: string;
  condition: string;
  boxPapers: string;
  photoCount: number;
  photo: string;
  status: ListingStatus;
  postedAt: string;
}

const SEED_LISTINGS: MyListing[] = [
  { id: 'seed-1', model: 'Rolex Submariner 126610LN', price: 12500, currency: 'USD', description: 'Full set, unworn. Box and papers from 2022.', condition: 'Unworn', boxPapers: 'Full set', photoCount: 3, photo: PHOTO_POOL[0], status: 'active', postedAt: '3d ago' },
  { id: 'seed-2', model: 'Tudor Black Bay 58 Navy', price: 3200, currency: 'USD', description: 'Great everyday diver, light wear on bracelet.', condition: 'Good', boxPapers: 'None', photoCount: 2, photo: PHOTO_POOL[9], status: 'active', postedAt: '5d ago' },
  { id: 'seed-3', model: 'Omega Seamaster 300M', price: 4100, currency: 'USD', description: 'Sold to happy buyer. Full set.', condition: 'Excellent', boxPapers: 'Full set', photoCount: 2, photo: PHOTO_POOL[4], status: 'sold', postedAt: '2w ago' },
];

let listings: MyListing[] = [];
const listeners = new Set<() => void>();
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = JSON.parse(raw) as any[];
      listings = parsed.map((l, i) => ({
        ...l,
        // Backfill photo for entries saved before the field existed
        photo: l.photo ?? PHOTO_POOL[i % PHOTO_POOL.length],
        // Migrate active: boolean → status for entries saved before the field existed
        status: (l.status as ListingStatus | undefined) ?? (l.active === false ? 'sold' : 'active'),
      })) as MyListing[];
    } else {
      listings = [...SEED_LISTINGS];
      persist();
    }
  } catch {
    listings = [...SEED_LISTINGS];
  }
}

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    /* quota / private mode */
  }
}

function notify(): void {
  for (const l of listeners) l();
}

// ── Subscription (useSyncExternalStore) ──────────────────────────────────────

export function subscribeListings(onStoreChange: () => void): () => void {
  hydrate();
  listeners.add(onStoreChange);
  if (typeof window !== 'undefined') {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        listings = e.newValue ? (JSON.parse(e.newValue) as MyListing[]) : [];
      } catch {
        /* ignore */
      }
      notify();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener('storage', onStorage);
    };
  }
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Stable string snapshot for useSyncExternalStore */
export function getListingsSnapshot(): string {
  hydrate();
  return JSON.stringify(listings);
}

export function getServerListingsSnapshot(): string {
  return JSON.stringify(SEED_LISTINGS);
}

// ── Actions ───────────────────────────────────────────────────────────────────

export function getMyListings(): MyListing[] {
  hydrate();
  return listings;
}

export function getMyListingById(id: string): MyListing | undefined {
  hydrate();
  return listings.find((l) => l.id === id);
}

export function addListing(
  data: Omit<MyListing, 'id' | 'postedAt' | 'status' | 'photo'>,
): MyListing {
  hydrate();
  const newListing: MyListing = {
    ...data,
    id: `user-${Date.now()}`,
    photo: nextPhoto(),
    status: 'active',
    postedAt: 'just now',
  };
  listings = [newListing, ...listings];
  persist();
  notify();
  return newListing;
}

export function updateListing(
  id: string,
  updates: Partial<Omit<MyListing, 'id' | 'photo' | 'postedAt'>>,
): void {
  hydrate();
  listings = listings.map((l) => (l.id === id ? { ...l, ...updates } : l));
  persist();
  notify();
}

export function removeMyListing(id: string): void {
  hydrate();
  listings = listings.filter((l) => l.id !== id);
  persist();
  notify();
}
