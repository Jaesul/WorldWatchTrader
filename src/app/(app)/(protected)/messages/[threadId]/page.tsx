import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';

import { DmThreadView } from '@/app/(app)/(protected)/messages/[threadId]/DmThreadView';
import { auth } from '@/auth';
import { assertThreadParticipant, getThreadById } from '@/db/queries/dm-threads';
import { Page } from '@/components/PageLayout';
import { getDb } from '@/db';
import { listingPhotos, listings, users } from '@/db/schema';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function DmThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ compose?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <>
        <Page.Header className="p-0">
          <TopBar title="Messages" />
        </Page.Header>
        <Page.Main className="mb-16 px-4">
          <p className="text-sm text-neutral-600">Sign in to view this conversation.</p>
        </Page.Main>
      </>
    );
  }

  const { threadId } = await params;
  const sp = await searchParams;
  const initialCompose = sp.compose === '1';
  const ok = await assertThreadParticipant(threadId, userId);
  if (!ok) notFound();

  const thread = await getThreadById(threadId);
  if (!thread) notFound();

  const db = getDb();
  const counterpartId = thread.buyerId === userId ? thread.sellerId : thread.buyerId;
  const [counterpart] = await db.select().from(users).where(eq(users.id, counterpartId)).limit(1);

  let listing: (typeof listings.$inferSelect) | undefined;
  let listingCoverUrl: string | null = null;
  if (thread.listingId) {
    const lid = thread.listingId;
    const [listingRows, photoRows] = await Promise.all([
      db.select().from(listings).where(eq(listings.id, lid)).limit(1),
      db
        .select({ url: listingPhotos.url })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, lid))
        .orderBy(asc(listingPhotos.sortOrder))
        .limit(1),
    ]);
    listing = listingRows[0];
    listingCoverUrl = photoRows[0]?.url ?? null;
  }

  const title = listing?.title ?? 'Conversation';
  const subtitle =
    counterpart?.username?.trim() ||
    counterpart?.handle?.trim() ||
    (counterpart?.walletAddress && counterpart.walletAddress.length > 14
      ? `${counterpart.walletAddress.slice(0, 6)}…${counterpart.walletAddress.slice(-4)}`
      : 'Chat');

  return (
    <>
      <Page.Header className="p-0">
        <TopBar title={subtitle} />
      </Page.Header>
      <Page.Main className="mb-16 flex min-h-0 flex-1 flex-col gap-2 px-4">
        <Link href="/messages" className="text-xs font-medium text-primary underline-offset-2 hover:underline">
          Back to inbox
        </Link>
        {listing ? (
          <p className="truncate text-xs text-neutral-500">
            About: <span className="font-medium text-neutral-800">{title}</span>
          </p>
        ) : null}
        <DmThreadView
          threadId={threadId}
          currentUserId={userId}
          initialCompose={initialCompose}
          listingPreview={
            listing
              ? {
                  listingId: listing.id,
                  title: listing.title,
                  priceUsd: listing.priceUsd,
                  status: listing.status,
                  imageUrl: listingCoverUrl,
                }
              : null
          }
        />
      </Page.Main>
    </>
  );
}
