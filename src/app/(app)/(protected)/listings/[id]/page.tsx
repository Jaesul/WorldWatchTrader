import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Listing" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <p className="text-sm text-neutral-600">
          <strong>UX springboard:</strong> watch detail + seller block +{' '}
          <em>public</em> comments thread. Listing id:{' '}
          <code className="rounded bg-neutral-100 px-1">{id}</code>
        </p>
        <SpringboardLink href="/listings">← Back to listings</SpringboardLink>
      </Page.Main>
    </>
  );
}
