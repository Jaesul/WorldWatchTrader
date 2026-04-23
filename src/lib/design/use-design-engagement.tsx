'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { useDesignViewer } from '@/lib/design/DesignViewerProvider';

type ListingLikesResponse = { listingIds: string[] };
type CommentLikesResponse = { commentIds: string[] };

async function fetchListingLikes(): Promise<ListingLikesResponse> {
  const res = await fetch('/api/design/listing-likes');
  if (!res.ok) throw new Error('fetch failed');
  return (await res.json()) as ListingLikesResponse;
}

async function fetchCommentLikes(): Promise<CommentLikesResponse> {
  const res = await fetch('/api/design/comment-likes');
  if (!res.ok) throw new Error('fetch failed');
  return (await res.json()) as CommentLikesResponse;
}

type DesignEngagementContextValue = {
  likedListingIds: Set<string>;
  likedCommentIds: Set<string>;
  displayListingLikes: (listingId: string, baseCount: number) => number;
  displayCommentLikes: (commentId: string, baseCount: number) => number;
  toggleListingLike: (listingId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;
  refreshEngagement: () => void;
};

const DesignEngagementContext = createContext<DesignEngagementContextValue | null>(null);

export function DesignEngagementProvider({ children }: { children: ReactNode }) {
  const { viewer } = useDesignViewer();
  const viewerId = viewer?.id ?? null;
  const [likedListingIds, setLikedListingIds] = useState<Set<string>>(new Set());
  const likedListingIdsRef = useRef(likedListingIds);
  likedListingIdsRef.current = likedListingIds;

  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const likedCommentIdsRef = useRef(likedCommentIds);
  likedCommentIdsRef.current = likedCommentIds;

  const [listingLikeDelta, setListingLikeDelta] = useState<Record<string, number>>({});
  const [commentLikeDelta, setCommentLikeDelta] = useState<Record<string, number>>({});

  const loadEngagement = useCallback(async () => {
    try {
      const [listingData, commentData] = await Promise.all([
        fetchListingLikes(),
        fetchCommentLikes(),
      ]);
      setLikedListingIds(new Set(listingData.listingIds));
      setLikedCommentIds(new Set(commentData.commentIds));
    } catch {
      toast.error('Could not load likes');
      setLikedListingIds(new Set());
      setLikedCommentIds(new Set());
    }
  }, []);

  useEffect(() => {
    void loadEngagement();
  }, [loadEngagement, viewerId]);

  useEffect(() => {
    setListingLikeDelta({});
    setCommentLikeDelta({});
  }, [viewerId]);

  const displayListingLikes = useCallback(
    (listingId: string, baseCount: number) => baseCount + (listingLikeDelta[listingId] ?? 0),
    [listingLikeDelta],
  );

  const displayCommentLikes = useCallback(
    (commentId: string, baseCount: number) => baseCount + (commentLikeDelta[commentId] ?? 0),
    [commentLikeDelta],
  );

  const toggleListingLike = useCallback(
    async (listingId: string) => {
      if (!viewerId) {
        toast.info('Pick a profile user in Design to use likes.');
        return;
      }
      const wasLiked = likedListingIdsRef.current.has(listingId);
      setLikedListingIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      setListingLikeDelta((d) => ({
        ...d,
        [listingId]: (d[listingId] ?? 0) + (wasLiked ? -1 : 1),
      }));
      try {
        const res = wasLiked
          ? await fetch(
              `/api/design/listing-likes?listingId=${encodeURIComponent(listingId)}`,
              { method: 'DELETE' },
            )
          : await fetch('/api/design/listing-likes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ listingId }),
            });
        if (!res.ok) throw new Error('request failed');
      } catch {
        setLikedListingIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        setListingLikeDelta((d) => ({
          ...d,
          [listingId]: (d[listingId] ?? 0) + (wasLiked ? 1 : -1),
        }));
        toast.error(wasLiked ? 'Could not remove like' : 'Could not like listing');
      }
    },
    [viewerId],
  );

  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      if (!viewerId) {
        toast.info('Pick a profile user in Design to use likes.');
        return;
      }
      const wasLiked = likedCommentIdsRef.current.has(commentId);
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(commentId);
        else next.add(commentId);
        return next;
      });
      setCommentLikeDelta((d) => ({
        ...d,
        [commentId]: (d[commentId] ?? 0) + (wasLiked ? -1 : 1),
      }));
      try {
        const res = wasLiked
          ? await fetch(
              `/api/design/comment-likes?commentId=${encodeURIComponent(commentId)}`,
              { method: 'DELETE' },
            )
          : await fetch('/api/design/comment-likes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ commentId }),
            });
        if (!res.ok) throw new Error('request failed');
      } catch {
        setLikedCommentIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(commentId);
          else next.delete(commentId);
          return next;
        });
        setCommentLikeDelta((d) => ({
          ...d,
          [commentId]: (d[commentId] ?? 0) + (wasLiked ? 1 : -1),
        }));
        toast.error(wasLiked ? 'Could not remove like' : 'Could not like comment');
      }
    },
    [viewerId],
  );

  const refreshEngagement = useCallback(() => {
    void loadEngagement();
  }, [loadEngagement]);

  const value = useMemo(
    () => ({
      likedListingIds,
      likedCommentIds,
      displayListingLikes,
      displayCommentLikes,
      toggleListingLike,
      toggleCommentLike,
      refreshEngagement,
    }),
    [
      likedListingIds,
      likedCommentIds,
      displayListingLikes,
      displayCommentLikes,
      toggleListingLike,
      toggleCommentLike,
      refreshEngagement,
    ],
  );

  return (
    <DesignEngagementContext.Provider value={value}>
      {children}
    </DesignEngagementContext.Provider>
  );
}

export function useDesignEngagement(): DesignEngagementContextValue {
  const ctx = useContext(DesignEngagementContext);
  if (!ctx) {
    throw new Error('useDesignEngagement must be used under DesignEngagementProvider');
  }
  return ctx;
}
