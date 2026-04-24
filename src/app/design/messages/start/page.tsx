'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { DesignDmThreadSkeleton } from '@/app/design/messages/DesignDmThreadSkeleton';
import { Button } from '@/components/ui/button';
import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

function DesignDmStartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!listingId?.trim()) {
      setError('Missing listing.');
      return;
    }
    if (!viewerId) return;
    if (ran.current) return;
    ran.current = true;

    (async () => {
      setError(null);
      const res = await fetch('/api/design/dm/threads/ensure', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listingId.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        const msg =
          j.error === 'cannot_message_self'
            ? 'You cannot message yourself on your own listing.'
            : j.error === 'listing_not_found'
              ? 'That listing could not be found.'
              : 'Could not open chat.';
        setError(msg);
        ran.current = false;
        return;
      }
      const data = (await res.json()) as { threadId: string };
      router.replace(
        `/design/messages/${data.threadId}?compose=1&listingContext=${encodeURIComponent(listingId.trim())}`,
      );
    })();
  }, [listingId, viewerId, router]);

  if (!viewerId) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        Pick a design profile user to message sellers.
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/design">Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!listingId?.trim()) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No listing selected.
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/design/messages">Inbox</Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/design">Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/design/messages">Inbox</Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/design">Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <DesignDmThreadSkeleton />;
}

export default function DesignDmStartPage() {
  return (
    <Suspense fallback={<DesignDmThreadSkeleton />}>
      <DesignDmStartPageInner />
    </Suspense>
  );
}
