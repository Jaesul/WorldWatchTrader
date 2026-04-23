'use client';

import { useEffect, useRef } from 'react';

export type DmListingSnapshotPayload = {
  listingId: string;
  title: string;
  priceUsd: number;
  status: string;
  imageUrl: string | null;
};

export type DmStreamMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  listingSnapshot?: DmListingSnapshotPayload | null;
};

/**
 * Subscribes to DM thread SSE (server polls Postgres). Default URL is the design sandbox stream.
 */
export type DmThreadStreamOptions = {
  /** Override default `/api/design/dm/threads/:id/stream`. */
  streamUrl?: (threadId: string) => string;
};

export function useDmThreadStream(
  threadId: string | null,
  onMessage: (msg: DmStreamMessage) => void,
  options?: DmThreadStreamOptions,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const streamUrlRef = useRef(options?.streamUrl);
  streamUrlRef.current = options?.streamUrl;

  useEffect(() => {
    if (!threadId) return;

    const url =
      streamUrlRef.current?.(threadId) ?? `/api/design/dm/threads/${threadId}/stream`;
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as
          | { type: 'ready'; threadId: string }
          | { type: 'message'; message: DmStreamMessage }
          | { type: 'error'; message?: string };
        if (data.type === 'message') {
          onMessageRef.current(data.message);
        }
      } catch {
        /* ignore malformed */
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [threadId]);
}

