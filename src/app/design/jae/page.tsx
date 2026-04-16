import Link from 'next/link';
import { Page } from '@/components/PageLayout';

/** Jae: entry point for your /design/jae sandbox. */
export default function DesignJaeHubPage() {
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Design route — /design/jae</p>
          <h1 className="text-2xl font-semibold text-foreground">Jae — design hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your standalone sandbox for Jae-owned work: listings, messages, and pay shells.
            Use the sky bar to move between routes while you iterate in localhost.
          </p>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/design/jae/home" className="font-medium text-primary underline-offset-4 hover:underline">
              Home (hub placeholder)
            </Link>
          </li>
          <li>
            <Link href="/design/jae/listings" className="font-medium text-primary underline-offset-4 hover:underline">
              Listings browse
            </Link>
          </li>
          <li>
            <Link href="/design/jae/messages" className="font-medium text-primary underline-offset-4 hover:underline">
              Messages inbox
            </Link>
          </li>
        </ul>
      </Page.Main>
    </Page>
  );
}
