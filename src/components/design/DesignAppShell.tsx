"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeftRight, Watch } from "lucide-react";

import { DesignNav } from "@/components/design/DesignNav";
import { WorldOrbIcon } from "@/components/icons/world-orb";
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
  const [isCompact, setIsCompact] = useState(false);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const setToolbar = useCallback((node: ReactNode | null) => {
    setToolbarState(node);
  }, []);
  const value = useMemo(() => ({ setToolbar }), [setToolbar]);

  useEffect(() => {
    const node = scrollRootRef.current;
    if (!node) return;

    const onScroll = () => {
      setIsCompact(node.scrollTop > 24);
    };

    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <DesignToolbarContext.Provider value={value}>
      <div
        data-design-app
        className="flex h-dvh flex-col bg-background"
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-3 bg-background px-3 transition-[padding] duration-200 ${
            isCompact ? "py-3" : "py-5"
          }`}
        >
          <header className="min-w-0 flex-1">
            <h1
              className={`flex flex-col items-start font-semibold tracking-tight transition-all duration-200 ${
                isCompact ? "gap-0.5 text-base" : "gap-1 text-xl"
              }`}
            >
              <span>World Watch Trader</span>
              <span
                className={`flex shrink-0 items-center text-foreground/80 transition-all duration-200 ${
                  isCompact ? "gap-1" : "gap-1.5"
                }`}
              >
                <WorldOrbIcon className={isCompact ? "size-3.5" : "size-5"} />
                <Watch
                  className={isCompact ? "size-3.5" : "size-5"}
                  strokeWidth={2.1}
                />
                <ArrowLeftRight
                  className={isCompact ? "size-3" : "size-4.5"}
                  strokeWidth={2.1}
                />
              </span>
            </h1>
          </header>
          {toolbar ? (
            <div
              className={`flex min-h-9 shrink-0 items-center justify-end gap-2 [&_button]:font-normal [&_button]:text-foreground [&_button_svg]:text-current ${
                isCompact ? "pt-0" : "pt-1"
              }`}
            >
              {toolbar}
            </div>
          ) : null}
        </div>
        <div
          ref={scrollRootRef}
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
