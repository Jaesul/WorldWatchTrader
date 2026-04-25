"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import {
  dismissWorldIdBanner,
  readBannerDismissed,
  readWorldIdVerified,
  WORLD_ID_PROTOTYPE_EVENT,
} from "@/lib/design/world-id-prototype";
import { useRouteMode } from "@/lib/route-mode/RouteModeProvider";

export function WorldIdCtaBanner() {
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const { basePath } = useRouteMode();

  const sync = useCallback(() => {
    setShow(!readWorldIdVerified() && !readBannerDismissed());
  }, []);

  useEffect(() => {
    sync();
    setReady(true);
    const onChange = () => sync();
    window.addEventListener("storage", onChange);
    window.addEventListener(
      WORLD_ID_PROTOTYPE_EVENT,
      onChange as EventListener,
    );
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(
        WORLD_ID_PROTOTYPE_EVENT,
        onChange as EventListener,
      );
    };
  }, [sync]);

  const handleDismiss = () => {
    dismissWorldIdBanner();
    sync();
  };

  if (!ready || !show) return null;

  return (
    <div className="shrink-0 border-b border-world-verified/25 bg-gradient-to-r from-world-verified/12 via-background to-world-verified/8 px-3 py-2.5 dark:from-world-verified/20 dark:via-background dark:to-world-verified/15 sm:px-4">
      <div className="mx-auto flex max-w-lg items-start gap-2.5 sm:gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground shadow-sm">
          <WorldOrbIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-snug text-world-verified">
            Verify with World ID
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Link your World ID to unlock the World Verified badge on your
            profile and listings.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 rounded-full bg-world-verified px-3 text-xs text-world-verified-foreground hover:bg-world-verified/90"
              asChild
            >
              <Link href={`${basePath}/profile`}>Get started</Link>
            </Button>
            <a
              href="https://docs.world.org/world-id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              What is World ID?
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-4"
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
