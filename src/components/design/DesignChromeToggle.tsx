'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'design-minimal-chrome';

function applyMinimal(minimal: boolean) {
  if (minimal) {
    document.documentElement.setAttribute('data-design-minimal', 'true');
  } else {
    document.documentElement.removeAttribute('data-design-minimal');
  }
}

export function DesignChromeToggle() {
  const [minimal, setMinimal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) === '1';
    setMinimal(stored);
    applyMinimal(stored);
  }, []);

  const toggle = useCallback(() => {
    setMinimal((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      applyMinimal(next);
      return next;
    });
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-[100] rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-md transition-colors hover:bg-muted"
      aria-pressed={minimal}
    >
      {minimal ? 'Show preview chrome' : 'Hide preview chrome'}
    </button>
  );
}
