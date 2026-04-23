import Link from 'next/link';

import { Page } from '@/components/PageLayout';
import { MessagesInbox } from '@/app/(app)/(protected)/messages/MessagesInbox';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function MessagesPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Messages" />
      </Page.Header>
      <Page.Main className="mb-16 flex flex-col gap-3 px-4">
        <p className="text-xs text-neutral-500">
          Private inbox tied to listings.{' '}
          <Link href="/listings" className="font-medium text-primary underline-offset-2 hover:underline">
            Browse listings
          </Link>
        </p>
        <MessagesInbox />
      </Page.Main>
    </>
  );
}
