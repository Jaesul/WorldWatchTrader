import Link from 'next/link';

import { DUMMY_LISTING_CARDS, FEATURED_LISTING_ID } from '@/lib/design-jae-listings-dummy';
import { ListingBrowseCard } from '@/components/design-jae/ListingBrowseCard';
import { Page } from '@/components/PageLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageProps = {
  searchParams: Promise<{ state?: string }>;
};

const browseCardPlaceholderShadow =
  'shadow-[0_2px_12px_-4px_rgb(0_0_0_/_0.1),0_1px_4px_-1px_rgb(0_0_0_/_0.07)] dark:shadow-[0_2px_16px_-4px_rgb(0_0_0_/_0.4),0_1px_4px_-1px_rgb(0_0_0_/_0.25)]';

function BrowseSkeletonGrid() {
  return (
    <div
      className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4"
      role="status"
      aria-label="Loading listings"
      aria-live="polite"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex min-w-0 animate-pulse flex-col overflow-hidden rounded-xl border border-black/5 bg-card text-sm ring-0',
            browseCardPlaceholderShadow,
          )}
        >
          <div className="border-b border-black/10 px-3 py-3">
            <div className="flex items-start gap-3">
              <div className="size-8 shrink-0 rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-32 max-w-[70%] rounded bg-muted" />
                <div className="flex items-center gap-2">
                  <div className="size-6 shrink-0 rounded-full bg-muted" />
                  <div className="h-2.5 w-32 rounded bg-muted" />
                  <div className="h-2.5 w-8 rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-b border-black/10 bg-black/[0.01] px-3 py-3">
            <div className="space-y-1.5">
              <div className="h-2.5 w-full max-w-[95%] rounded bg-muted" />
              <div className="h-2.5 w-full max-w-[92%] rounded bg-muted" />
              <div className="h-2.5 w-4/5 max-w-full rounded bg-muted" />
              <div className="h-2.5 w-2/3 max-w-full rounded bg-muted" />
            </div>
          </div>
          <div className="grid aspect-[16/10] w-full grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-1 bg-black/5 p-1">
            <div className="rounded-sm bg-muted" />
            <div className="grid grid-rows-2 gap-1">
              <div className="rounded-sm bg-muted" />
              <div className="rounded-sm bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-black/10 px-2 py-1.5">
            <div className="h-9 flex-1 rounded-md bg-muted" />
            <div className="h-9 flex-1 rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DesignJaeListingsPage({ searchParams }: PageProps) {
  const { state } = await searchParams;
  const showLoading = state === 'loading';
  const showError = state === 'error';

  return (
    <Page className="min-h-0">
      <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">Listings</h1>
          <p className="text-sm text-muted-foreground">
            Browse luxury watches — design sandbox (<code className="rounded bg-muted px-1">/design/jae/listings</code>
            ).
          </p>
        </div>
      </Page.Header>
      <Page.Main className="flex flex-col gap-6 px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/design/jae/listings/new"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            New listing
          </Link>
          <Link
            href={`/design/jae/listings/${FEATURED_LISTING_ID}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Sample detail
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="self-center font-medium text-foreground/80">UI states (query):</span>
          <Link href="/design/jae/listings" className="underline-offset-4 hover:underline">
            Loaded
          </Link>
          <span aria-hidden>·</span>
          <Link href="/design/jae/listings?state=loading" className="underline-offset-4 hover:underline">
            Loading
          </Link>
          <span aria-hidden>·</span>
          <Link href="/design/jae/listings?state=error" className="underline-offset-4 hover:underline">
            Error copy
          </Link>
        </div>

        {showError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t load listings</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <p>Check your connection and try again. In production we&apos;d retry or show support.</p>
              <Link
                href="/design/jae/listings"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'w-fit border-destructive/40',
                )}
              >
                Retry
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {showLoading ? (
          <BrowseSkeletonGrid />
        ) : showError ? null : (
          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4">
            {DUMMY_LISTING_CARDS.map((listing) => (
              <ListingBrowseCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </Page.Main>
    </Page>
  );
}
