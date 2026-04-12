import Link from 'next/link';

import { JaeNewListingForm } from '@/components/design-jae/JaeNewListingForm';
import { Page } from '@/components/PageLayout';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DesignJaeNewListingPage() {
  return (
    <Page className="min-h-0">
      <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
        <Link
          href="/design/jae/listings"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2 w-fit px-2')}
        >
          ← Listings
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">New listing</h1>
          <p className="text-sm text-muted-foreground">
            World ID required to publish — use the design toggle to preview the form.
          </p>
        </div>
      </Page.Header>
      <Page.Main className="flex flex-col gap-6 px-4 pb-8">
        <JaeNewListingForm />
      </Page.Main>
    </Page>
  );
}
