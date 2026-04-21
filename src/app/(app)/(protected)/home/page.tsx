import Image from 'next/image';
import Link from 'next/link';

import { auth } from '@/auth';
import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { Pay } from '@/components/Pay';
import { Transaction } from '@/components/Transaction';
import { UserInfo } from '@/components/UserInfo';
import { Verify } from '@/components/Verify';
import { ViewPermissions } from '@/components/ViewPermissions';
import { listActiveListingsWithSellerAndHero } from '@/db/queries/listings';
import { formatPrice } from '@/lib/design/data';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function Home() {
  const session = await auth();
  const feed = await listActiveListingsWithSellerAndHero(20);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Home"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <p className="w-full text-center text-sm text-neutral-600">
          <SpringboardLink href="/listings">Open listings grid</SpringboardLink>
        </p>

        <section className="w-full max-w-lg space-y-3">
          <h2 className="text-sm font-semibold text-neutral-800">Latest on the marketplace</h2>
          {feed.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No listings yet. Run <code className="rounded bg-neutral-100 px-1">npm run db:seed</code> with{' '}
              <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code> set.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {feed.map(({ listing, seller, heroUrl }) => (
                <li key={listing.id}>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-neutral-50"
                  >
                    {heroUrl ? (
                      <Image
                        src={heroUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="size-16 shrink-0 rounded-lg bg-neutral-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{listing.title}</p>
                      <p className="text-xs text-neutral-500">{seller.username}</p>
                      <p className="text-sm font-bold text-neutral-900">{formatPrice(listing.priceUsd)}</p>
                      {listing.condition ? (
                        <p className="text-xs text-neutral-500">{listing.condition}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <UserInfo />
        <Verify action="test-action" />
        <Pay />
        <Transaction />
        <ViewPermissions />
      </Page.Main>
    </>
  );
}
