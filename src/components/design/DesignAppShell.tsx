"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

import { DesignNav } from "@/components/design/DesignNav";
import { SoldLuxuryCelebrationLayer } from "@/components/design/SoldLuxuryCelebrationLayer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useRouteMode } from "@/lib/route-mode/RouteModeProvider";

/**
 * Design route shell: compact brand row, scroll root for page content,
 * bottom nav and toasts. The `/design/welcome` route renders without the
 * shell chrome so the full-bleed landing layout can breathe.
 */
export function DesignAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { basePath } = useRouteMode();
  const isWelcome =
    pathname === "/design/welcome" || pathname === "/welcome";
  const { viewer } = useDesignViewer();
  const avatarUrl = viewer?.profilePictureUrl?.trim() || undefined;
  const avatarLabel = viewer?.username ?? "Profile";
  const avatarInitial =
    viewer?.username?.trim().charAt(0).toUpperCase() ?? "";

  if (isWelcome) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        {children}
        <SoldLuxuryCelebrationLayer />
        <Toaster position="bottom-center" />
      </div>
    );
  }

  return (
    <div data-design-app className="flex h-dvh flex-col bg-background">
      <div className="flex min-w-0 shrink-0 items-center gap-3 bg-background px-3 py-4">
        <header className="flex min-w-0 shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            aria-hidden
            className="size-8 shrink-0"
          />
          <h1 className="shrink-0 whitespace-nowrap text-2xl font-semibold tracking-tight text-foreground">
            World Watch Trader
          </h1>
        </header>
        <Link
          href={`${basePath}/profile`}
          aria-label="Profile"
          className="ml-auto shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar className="size-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={avatarLabel} />
            ) : null}
            <AvatarFallback>
              {avatarInitial ? (
                avatarInitial
              ) : (
                <User strokeWidth={1.8} className="size-5" />
              )}
            </AvatarFallback>
          </Avatar>
        </Link>
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
  );
}
