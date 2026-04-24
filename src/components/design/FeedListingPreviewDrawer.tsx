"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ListingDetailDrawer } from "@/components/design/ListingDetailDrawer";
import { useDrawerResident } from "@/hooks/use-drawer-resident";
import { LISTINGS, type Listing } from "@/lib/design/data";
import {
  createInitialComments,
  type FakeComment,
  type RichComment,
  VIEWER_COMMENT_AUTHOR,
} from "@/lib/design/listing-drawer-comments";
import { toggleLike as toggleCatalogLike } from "@/lib/design/interaction-store";
import { isUuid } from "@/lib/design/is-uuid";
import { useDesignViewer } from "@/lib/design/DesignViewerProvider";
import { useDesignEngagement } from "@/lib/design/use-design-engagement";
import { useDesignListingSaves } from "@/lib/design/use-design-listing-saves";
import { useLikedIds } from "@/lib/design/use-liked-ids";

const FALLBACK_VIEWER_COMMENT_AVATAR = "https://i.pravatar.cc/150?u=me-user";

export interface FeedListingPreviewDrawerProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set (e.g. sold listings on a public profile), listing drawer is read-only for replies/comments. */
  soldHistory?: { soldAtLabel: string };
}

export function FeedListingPreviewDrawer({
  listing,
  open,
  onOpenChange,
  soldHistory,
}: FeedListingPreviewDrawerProps) {
  const { viewer } = useDesignViewer();
  const viewerCommentAvatar =
    viewer?.profilePictureUrl?.trim() || FALLBACK_VIEWER_COMMENT_AVATAR;

  const catalogLikedIds = useLikedIds();
  const {
    likedListingIds,
    likedCommentIds,
    ensureLoaded: ensureEngagementLoaded,
    displayListingLikes,
    displayCommentLikes,
    toggleListingLike,
    toggleCommentLike,
  } = useDesignEngagement();
  const { savedIds, ensureSavedIdsLoaded, toggleSave } = useDesignListingSaves();
  const [commentsByListing, setCommentsByListing] = useState<
    Record<string, FakeComment[]>
  >(() => createInitialComments(LISTINGS));
  const [catalogCommentLikedIds, setCatalogCommentLikedIds] = useState<
    Set<string>
  >(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (!open || !listing) return;
    void ensureEngagementLoaded();
    void ensureSavedIdsLoaded();
  }, [ensureEngagementLoaded, ensureSavedIdsLoaded, listing, open]);

  const residentListing = useDrawerResident(listing);

  const listingIsLive = Boolean(residentListing && isUuid(residentListing.id));

  const comments: RichComment[] = useMemo(() => {
    if (!residentListing) return [];
    const raw = commentsByListing[residentListing.id] ?? [];
    return raw
      .map((c) => ({
        ...c,
        effectiveLikes: isUuid(c.id)
          ? displayCommentLikes(c.id, c.likes)
          : c.likes + (catalogCommentLikedIds.has(c.id) ? 1 : 0),
      }))
      .sort((a, b) => b.effectiveLikes - a.effectiveLikes);
  }, [
    residentListing,
    commentsByListing,
    catalogCommentLikedIds,
    displayCommentLikes,
  ]);

  const addComment = useCallback(() => {
    if (!residentListing) return;
    const body = (commentDrafts[residentListing.id] ?? "").trim();
    if (!body) return;
    setCommentsByListing((prev) => {
      const next: FakeComment = {
        id: `${residentListing.id}-comment-${Date.now()}`,
        author: VIEWER_COMMENT_AUTHOR,
        avatar: viewerCommentAvatar,
        body,
        timeLabel: "Just now",
        likes: 0,
        authorUserId: viewer?.id,
      };
      return {
        ...prev,
        [residentListing.id]: [...(prev[residentListing.id] ?? []), next],
      };
    });
    setCommentDrafts((prev) => ({ ...prev, [residentListing.id]: "" }));
  }, [residentListing, commentDrafts, viewer?.id, viewerCommentAvatar]);

  const onToggleCommentLike = useCallback(
    (commentId: string) => {
      if (isUuid(commentId)) void toggleCommentLike(commentId);
      else {
        setCatalogCommentLikedIds((prev) => {
          const next = new Set(prev);
          if (next.has(commentId)) next.delete(commentId);
          else next.add(commentId);
          return next;
        });
      }
    },
    [toggleCommentLike],
  );

  const deleteComment = useCallback((listingId: string, commentId: string) => {
    setCommentsByListing((prev) => ({
      ...prev,
      [listingId]: (prev[listingId] ?? []).filter((c) => c.id !== commentId),
    }));
    setCatalogCommentLikedIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    toast.success("Comment deleted");
  }, []);

  if (!residentListing) return null;

  const likedListing = listingIsLive
    ? likedListingIds.has(residentListing.id)
    : catalogLikedIds.has(residentListing.id);
  const likeCount = listingIsLive
    ? displayListingLikes(residentListing.id, residentListing.likes)
    : residentListing.likes +
      (catalogLikedIds.has(residentListing.id) ? 1 : 0);

  const commentLikedSet = listingIsLive ? likedCommentIds : catalogCommentLikedIds;

  return (
    <ListingDetailDrawer
      listing={residentListing}
      open={open}
      onOpenChange={onOpenChange}
      liked={likedListing}
      likeCount={likeCount}
      onToggleLike={() =>
        listingIsLive
          ? void toggleListingLike(residentListing.id)
          : toggleCatalogLike(residentListing.id)
      }
      saved={savedIds.has(residentListing.id)}
      onToggleSave={() => void toggleSave(residentListing.id)}
      comments={comments}
      commentLikedIds={commentLikedSet}
      onToggleCommentLike={onToggleCommentLike}
      onDeleteComment={(commentId) =>
        deleteComment(residentListing.id, commentId)
      }
      commentDraft={commentDrafts[residentListing.id] ?? ""}
      onCommentDraftChange={(val) =>
        setCommentDrafts((prev) => ({ ...prev, [residentListing.id]: val }))
      }
      onAddComment={addComment}
      soldHistory={soldHistory}
    />
  );
}
