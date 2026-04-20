/**
 * Full-screen “sold” celebration (design sandbox). Survives MarkSoldSheet unmount
 * because parents clear listing state as the sheet closes.
 */

const listeners = new Set<() => void>();

/** Giphy direct URLs — yachts, champagne, money flex, peak absurd wealth energy */
export const LUXURY_SOLD_GIFS = [
  'https://media.giphy.com/media/3o7TKVfQSGPb3N1r7a/giphy.gif',
  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
  'https://media.giphy.com/media/26BRv0ThflVHC/giphy.gif',
  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  'https://media.giphy.com/media/3ohzdIuqgUjw7ztiQU/giphy.gif',
  'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
  'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
  'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
  'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  'https://media.giphy.com/media/l0MYd5y9lqyxOaRn2/giphy.gif',
  'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
  'https://media.giphy.com/media/3o7TKSjRrfIPje/giphy.gif',
] as const;

let celebrationUrl: string | null = null;

function emit(): void {
  for (const l of listeners) l();
}

export function pickRandomLuxurySoldGif(): string {
  const i = Math.floor(Math.random() * LUXURY_SOLD_GIFS.length);
  return LUXURY_SOLD_GIFS[i]!;
}

export function subscribeSoldLuxuryCelebration(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getSoldLuxuryCelebrationSnapshot(): string | null {
  return celebrationUrl;
}

export function getServerSoldLuxuryCelebrationSnapshot(): string | null {
  return null;
}

export function showSoldLuxuryCelebration(url: string): void {
  celebrationUrl = url;
  emit();
}

export function dismissSoldLuxuryCelebration(): void {
  celebrationUrl = null;
  emit();
}
