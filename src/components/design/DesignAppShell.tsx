"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DesignNav } from "@/components/design/DesignNav";
import { SoldLuxuryCelebrationLayer } from "@/components/design/SoldLuxuryCelebrationLayer";
import { Toaster } from "@/components/ui/sonner";

type DesignToolbarContextValue = {
  setToolbar: (node: ReactNode | null) => void;
};

const DesignToolbarContext = createContext<DesignToolbarContextValue | null>(
  null,
);

export function useDesignToolbar() {
  const ctx = useContext(DesignToolbarContext);
  if (!ctx) {
    throw new Error("useDesignToolbar must be used within DesignAppShell");
  }
  return ctx;
}

/**
 * Design route shell: title row with optional right toolbar (marketplace registers controls),
 * scroll root for page content, bottom nav and toasts.
 */
export function DesignAppShell({ children }: { children: ReactNode }) {
  const [toolbar, setToolbarState] = useState<ReactNode | null>(null);
  const setToolbar = useCallback((node: ReactNode | null) => {
    setToolbarState(node);
  }, []);
  const value = useMemo(() => ({ setToolbar }), [setToolbar]);

  return (
    <DesignToolbarContext.Provider value={value}>
      <div
        data-design-app
        className="flex h-dvh flex-col bg-background"
      >
        <div className="flex shrink-0 items-center gap-3 bg-background px-4 py-5">
          <header className="min-w-0 shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight">World Watch Trader</h1>
          </header>
          {toolbar ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 [&_button]:font-normal">
              {toolbar}
            </div>
          ) : null}
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          data-design-scroll-root
        >
          {children}
        </div>
        <DesignNav />
        <SoldLuxuryCelebrationLayer />
        <Toaster position="bottom-center" />
      </div>
    </DesignToolbarContext.Provider>
  );
}
