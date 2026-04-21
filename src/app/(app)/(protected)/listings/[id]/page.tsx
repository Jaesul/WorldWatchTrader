import { auth } from '@/auth';
import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { getListingById } from '@/db/queries/listings';
import { formatPrice } from '@/lib/design/data';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const data = await getListingById(id, { viewerUserId: session?.user?.id ?? null });
  if (!data) {
    notFound();
  }

  const { listing, seller, photos } = data;
  const heroUrl = photos[0]?.url ?? null;

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Listing" />
      </Page.Header>
      <Page.Main className="mb-16 flex flex-col gap-4 px-4 pt-2">
        <p className="text-xs text-emerald-700">Listing is live on the home feed.</p>
        {heroUrl ? (
          <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            <Image src={heroUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
          </div>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{listing.title}</h2>
          <p className="text-sm text-neutral-600">{seller.username}</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">{formatPrice(listing.priceUsd)}</p>
          {listing.condition ? (
            <p className="text-sm text-neutral-600">Condition: {listing.condition}</p>
          ) : null}
          {listing.modelNumber ? (
            <p className="text-sm text-neutral-600">Model: {listing.modelNumber}</p>
          ) : null}
        </div>
        {listing.details ? (
          <p className="whitespace-pre-wrap text-sm text-neutral-800">{listing.details}</p>
        ) : null}
        <div className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
          <SpringboardLink href="/home">← Home</SpringboardLink>
          <SpringboardLink href="/listings">← All listings</SpringboardLink>
        </div>
      </Page.Main>
    </>
  );
}
