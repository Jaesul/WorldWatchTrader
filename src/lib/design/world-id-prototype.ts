/**
 * Design-sandbox prototype for World ID + top CTA banner.
 * Replace with real auth / MiniKit when wiring production routes.
 */

const VERIFIED_KEY = 'wwt-design-world-id-verified';
const BANNER_DISMISSED_KEY = 'wwt-design-world-id-banner-dismissed';

export const WORLD_ID_PROTOTYPE_EVENT = 'wwt-world-id-prototype';

export function readWorldIdVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(VERIFIED_KEY) === '1';
}

export function setWorldIdVerified(verified: boolean): void {
  if (typeof window === 'undefined') return;
  if (verified) window.localStorage.setItem(VERIFIED_KEY, '1');
  else window.localStorage.removeItem(VERIFIED_KEY);
  window.dispatchEvent(new CustomEvent(WORLD_ID_PROTOTYPE_EVENT));
}

export function readBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
}

export function dismissWorldIdBanner(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BANNER_DISMISSED_KEY, '1');
  window.dispatchEvent(new CustomEvent(WORLD_ID_PROTOTYPE_EVENT));
}
