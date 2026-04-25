import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { DesignDmThreadSkeleton } from '@/app/design/messages/DesignDmThreadSkeleton';
import { DesignDmThreadPageClient } from '@/app/design/messages/[threadId]/DesignDmThreadPageClient';
import { designDmReplyHref } from '@/lib/design/dm-reply';
import { isUuid } from '@/lib/design/is-uuid';

/**
 * Base-route mirror of `/design/messages/[threadId]`. Same client UI as the
 * sandbox; only the server-side redirect targets differ so out-of-route bounces
 * stay inside the NextAuth-gated surface.
 */
export default async function DmThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ compose?: string; listing?: string; listingContext?: string }>;
}) {
  const { threadId } = await params;
  const sp = await searchParams;
  const listingParam = typeof sp.listing === 'string' ? sp.listing.trim() : '';
  const initialListingContext =
    typeof sp.listingContext === 'string' && sp.listingContext.trim() ? sp.listingContext.trim() : null;

  if (!threadId || !isUuid(threadId)) {
    if (listingParam && isUuid(listingParam)) {
      redirect(designDmReplyHref(listingParam, ''));
    }
    redirect('/messages');
  }

  const initialCompose = sp.compose === '1';

  return (
    <Suspense fallback={<DesignDmThreadSkeleton />}>
      <DesignDmThreadPageClient
        threadId={threadId}
        initialCompose={initialCompose}
        initialListingContextId={initialListingContext}
      />
    </Suspense>
  );
}
