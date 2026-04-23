"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import {
  readWorldIdVerified,
  WORLD_ID_PROTOTYPE_EVENT,
} from "@/lib/design/world-id-prototype";

const FIND_ORB_URL = "https://world.org/find-orb";

/** Stable id so rapid blocked actions replace one toast instead of stacking. */
const ORB_GATE_TOAST_ID = "wwt-design-orb-gate";

export type BlockDesignInteractionOptions = {
  /**
   * When true, the current design viewer is orb-verified in the database.
   * Pass from `useDesignViewer().viewer?.orbVerified` so the gate matches server-backed status,
   * not only the localStorage prototype toggle.
   */
  viewerOrbVerified?: boolean;
};

function OrbGateToastMarkup() {
  return (
    <div
      role="status"
      className="flex w-[min(calc(100vw-1.5rem),22rem)] flex-col items-center gap-3 rounded-2xl border-2 border-world-verified/55 bg-card px-4 py-3.5 text-center text-card-foreground shadow-lg shadow-black/10 dark:shadow-black/40"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground shadow-md">
        <WorldOrbIcon className="size-[18px]" />
      </div>
      <div className="w-full min-w-0">
        <p className="text-sm font-semibold leading-snug tracking-tight text-foreground text-pretty">
          You must be orb verified to interact with these grails.
        </p>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground text-pretty">
          <a
            href={FIND_ORB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-world-verified underline decoration-world-verified/60 underline-offset-2 transition-colors hover:text-world-verified/90"
          >
            Click here
          </a>{" "}
          to find an Orb near you.
        </p>
      </div>
    </div>
  );
}

/**
 * @returns true when the action should be blocked (user is not orb-verified in the design sandbox).
 */
export function blockDesignInteractionWithoutWorldId(
  options?: BlockDesignInteractionOptions,
): boolean {
  if (typeof window === "undefined") return false;
  if (readWorldIdVerified()) return false;
  if (options?.viewerOrbVerified === true) return false;

  toast.custom(() => <OrbGateToastMarkup />, {
    id: ORB_GATE_TOAST_ID,
    duration: 10_000,
    unstyled: true,
    closeButton: false,
    className:
      "w-auto max-w-[min(calc(100vw-1.5rem),22rem)] overflow-visible border-0 bg-transparent p-0 shadow-none",
  });
  return true;
}

export function useDesignWorldIdVerified(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => onStoreChange();
      window.addEventListener(WORLD_ID_PROTOTYPE_EVENT, handler);
      return () => window.removeEventListener(WORLD_ID_PROTOTYPE_EVENT, handler);
    },
    () => readWorldIdVerified(),
    () => false,
  );
}
