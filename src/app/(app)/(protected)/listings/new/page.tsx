import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function NewListingPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="New listing" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <p className="text-sm text-neutral-600">
          <strong>UX springboard:</strong> form fields (title, details, …). World ID required
          to submit — enforce in a later pass.
        </p>
        <SpringboardLink href="/listings">← Back to listings</SpringboardLink>
      </Page.Main>
    </>
  );
}
