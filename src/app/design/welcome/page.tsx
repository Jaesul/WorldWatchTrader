"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorldOrbIcon } from "@/components/icons/world-orb";
import { useDesignWorldIdVerified } from "@/lib/design/world-id-interaction-gate";

const FIND_ORB_URL = "https://world.org/find-orb";

export default function DesignWelcomePage() {
  const orbVerified = useDesignWorldIdVerified();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-10 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-5%,color-mix(in_oklab,var(--world-verified)_42%,transparent)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-world-verified/55 to-transparent"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        {!mounted ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-16 animate-pulse items-center justify-center rounded-full bg-world-verified/25" />
            <p className="text-sm font-medium text-muted-foreground">Loading…</p>
          </div>
        ) : (
          <>
            <div className="mb-10 flex size-[5.25rem] items-center justify-center rounded-full bg-world-verified text-world-verified-foreground shadow-[0_22px_64px_-14px] shadow-world-verified/50 ring-4 ring-world-verified/20">
              <WorldOrbIcon className="size-11" />
            </div>

            {orbVerified ? (
              <>
                <p className="max-w-md text-pretty text-xl font-medium leading-relaxed tracking-tight text-foreground sm:text-2xl">
                  Welcome to{" "}
                  <span className="font-semibold text-world-verified">
                    World Watch Trader
                  </span>{" "}
                  - the world&apos;s first watch trading platform; for humans,
                  by humans.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-12 h-12 min-w-[11rem] rounded-full bg-world-verified px-10 text-base font-semibold text-world-verified-foreground shadow-lg shadow-world-verified/30 transition hover:bg-world-verified/90"
                >
                  <Link href="/design">Enter</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="max-w-md text-pretty text-xl font-medium leading-relaxed tracking-tight text-foreground sm:text-2xl">
                  Welcome to{" "}
                  <span className="font-semibold text-world-verified">
                    World Watch Trader
                  </span>{" "}
                  - the world&apos;s first watch trading platform; for humans,
                  by humans. You must be orb-verified to interact with
                  listings.
                </p>
                <div className="mt-12 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full border border-transparent bg-world-verified px-8 text-base font-semibold text-world-verified-foreground shadow-lg shadow-world-verified/30 transition hover:bg-world-verified/90"
                  >
                    <a
                      href={FIND_ORB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Find an Orb near you
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full border-2 border-dashed border-muted-foreground/45 bg-white px-8 text-base font-semibold text-foreground shadow-none hover:bg-muted/15 dark:border-muted-foreground/40 dark:bg-card"
                  >
                    <Link href="/design">Browse only</Link>
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <p className="relative z-[1] mt-auto pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 text-center text-[11px] text-muted-foreground">
        Sandbox: orb status matches{" "}
        <Link
          href="/design/profile"
          className="font-medium text-world-verified underline-offset-2 hover:underline"
        >
          Profile → World ID
        </Link>
      </p>
    </main>
  );
}
