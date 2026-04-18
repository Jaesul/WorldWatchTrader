import Link from 'next/link';

import { DUMMY_LISTING_CARDS, getDummyListingDetail } from '@/lib/design-jae-listings-dummy';
import { JaeListingDetail } from '@/components/design-jae/JaeListingDetail';
import { JaeListingPlaceholderDetail } from '@/components/design-jae/JaeListingPlaceholderDetail';
import { Page } from '@/components/PageLayout';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DesignJaeListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = getDummyListingDetail(id);
  const card = DUMMY_LISTING_CARDS.find((c) => c.id === id);

  return (
    <Page className="min-h-0">
      <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
        <Link
          href="/design/jae/listings"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2 w-fit px-2')}
        >
          ← Listings
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Listing</h1>
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 px-4 pb-8">
        {detail ? (
          <JaeListingDetail listing={detail} />
        ) : card ? (
          <JaeListingPlaceholderDetail card={card} />
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              No design stub for <code className="rounded bg-muted px-1">{id}</code>. Use a listing from
              browse or the sample Rolex.
            </p>
            <Link href="/design/jae/listings" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
              Back to listings
            </Link>
          </div>
        )}
      </Page.Main>
    </Page>
  );
}
