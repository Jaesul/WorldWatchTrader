/**
 * Full-screen “sold” celebration (design sandbox). Survives MarkSoldSheet unmount
 * because parents clear listing state as the sheet closes.
 *
 * GIFs are shipped under /public/design/sold-celebration/ (see SOURCES.txt there).
 */

const listeners = new Set<() => void>();

/** Local celebratory / money-adjacent GIFs (random pick on each sale). */
export const LUXURY_SOLD_GIFS = [
  '/design/sold-celebration/smiley-dance.gif',
  '/design/sold-celebration/smiley-wink.gif',
  '/design/sold-celebration/money-chart.gif',
  '/design/sold-celebration/gold-history.gif',
  '/design/sold-celebration/trophy-icon.gif',
  '/design/sold-celebration/trophy-teams.gif',
  '/design/sold-celebration/money-eyes.gif',
  '/design/sold-celebration/euro-cyprus.gif',
  '/design/sold-celebration/euro-one.gif',
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
