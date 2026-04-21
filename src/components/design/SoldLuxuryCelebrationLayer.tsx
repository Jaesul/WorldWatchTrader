'use client';

import { useSyncExternalStore, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  subscribeSoldLuxuryCelebration,
  getSoldLuxuryCelebrationSnapshot,
  getServerSoldLuxuryCelebrationSnapshot,
  dismissSoldLuxuryCelebration,
} from '@/lib/design/sold-luxury-celebration';
import { Button } from '@/components/ui/button';

export function SoldLuxuryCelebrationLayer() {
  const url = useSyncExternalStore(
    subscribeSoldLuxuryCelebration,
    getSoldLuxuryCelebrationSnapshot,
    getServerSoldLuxuryCelebrationSnapshot,
  );

  const onDismiss = useCallback(() => {
    dismissSoldLuxuryCelebration();
  }, []);

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url, onDismiss]);

  if (typeof document === 'undefined' || !url) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-amber-950 via-neutral-950 to-black p-6 text-center animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Listing sold celebration"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
      >
        <div className="absolute -left-1/4 top-0 size-[80vmin] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 size-[70vmin] rounded-full bg-yellow-300/15 blur-3xl" />
      </div>

      <p className="relative z-10 max-w-[min(100%,36rem)] px-2 font-heading text-2xl font-black uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.5)] sm:text-3xl sm:tracking-[0.2em]">
        Liquidated. Elevated.
      </p>

      {/* Fixed-size stage: img fills it so object-contain upscales tiny GIFs instead of leaving them pixel-sized */}
      <div className="relative z-10 box-border h-[min(56dvh,580px)] w-full max-w-[min(96vw,680px)] min-h-[280px] shrink-0 overflow-hidden rounded-2xl border-4 border-amber-400/80 bg-black/90 shadow-[0_0_60px_rgba(251,191,36,0.35),inset_0_0_30px_rgba(250,204,21,0.08)] ring-2 ring-yellow-200/30 sm:min-h-[320px]">
        <img
          src={url}
          alt=""
          className="block h-full w-full object-contain p-2 sm:p-3 [image-rendering:auto]"
        />
      </div>

      <p className="relative z-10 max-w-sm text-xs font-medium uppercase tracking-widest text-amber-200/80">
        Don’t blow it all in one place!
      </p>

      <Button
        type="button"
        size="lg"
        className="relative z-10 border-amber-400/50 bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-lg hover:from-amber-300 hover:to-amber-500"
        onClick={onDismiss}
      >
        Back to browsing
      </Button>
    </div>,
    document.body,
  );
}
