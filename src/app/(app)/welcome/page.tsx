import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthButton } from '@/components/AuthButton';
import { Button } from '@/components/ui/button';
import { WorldOrbIcon } from '@/components/icons/world-orb';
import { getCachedSession } from '@/lib/auth/get-session';

const FIND_ORB_URL = 'https://world.org/find-orb';

/**
 * Public landing page for the base routes. Renders without the gated app shell
 * so a logged-out user can sign in via World App / MiniKit. Once a session is
 * established (or an existing one is detected on load) we punt them straight
 * to the marketplace feed at `/`.
 */
export default async function WelcomePage() {
  const session = await getCachedSession();
  if (session?.user?.id) {
    redirect('/');
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-5 py-10 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-5%,color-mix(in_oklab,var(--world-verified)_42%,transparent)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-world-verified/55 to-transparent"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <div className="mb-10 flex size-[5.25rem] items-center justify-center rounded-full bg-world-verified text-world-verified-foreground shadow-[0_22px_64px_-14px] shadow-world-verified/50 ring-4 ring-world-verified/20">
          <WorldOrbIcon className="size-11" />
        </div>

        <p className="max-w-md text-pretty text-xl font-medium leading-relaxed tracking-tight text-foreground sm:text-2xl">
          Welcome to{' '}
          <span className="font-semibold text-world-verified">
            World Watch Trader
          </span>{' '}
          — the world&apos;s first watch trading platform; for humans, by
          humans.
        </p>

        <div className="mt-12 flex w-full max-w-md flex-col items-center gap-3">
          <AuthButton />
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an Orb yet?{' '}
            <a
              href={FIND_ORB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-world-verified underline-offset-2 hover:underline"
            >
              Find one near you
            </a>
            .
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 w-full max-w-xs rounded-full border-2 border-dashed border-muted-foreground/45 bg-white px-8 text-base font-semibold text-foreground shadow-none hover:bg-muted/15 dark:border-muted-foreground/40 dark:bg-card"
          >
            <Link href="/design">Browse only (sandbox)</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
