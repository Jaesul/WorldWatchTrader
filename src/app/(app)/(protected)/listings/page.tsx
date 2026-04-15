import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function ListingsPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Listings" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <p className="text-sm text-neutral-600">
          <strong>UX springboard:</strong> browse grid/cards for watches go here. No real
          data yet.
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <SpringboardLink href="/listings/new">Add listing (stub)</SpringboardLink>
          </li>
          <li>
            <SpringboardLink href="/listings/example-id">
              Example listing detail (stub)
            </SpringboardLink>
          </li>
        </ul>
      </Page.Main>
    </>
  );
}
