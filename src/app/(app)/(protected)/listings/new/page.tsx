import { NewListingForm } from '@/components/listings/NewListingForm';
import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function NewListingPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="New listing" />
      </Page.Header>
      <Page.Main className="mb-16 flex flex-col gap-4 px-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Add photos from your library or camera, then publish. Listings go live on Home right away.
        </p>
        <NewListingForm />
        <SpringboardLink href="/listings" className="text-sm text-neutral-600">
          ← Back to listings
        </SpringboardLink>
      </Page.Main>
    </>
  );
}
