"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { ListingDetailDrawer } from "@/components/design/ListingDetailDrawer";
import { LISTINGS, type Listing } from "@/lib/design/data";
import {
  createInitialComments,
  type FakeComment,
  type RichComment,
  VIEWER_COMMENT_AUTHOR,
} from "@/lib/design/listing-drawer-comments";
import {
  toggleLike as toggleDesignLike,
  toggleSave,
} from "@/lib/design/interaction-store";
import { useLikedIds } from "@/lib/design/use-liked-ids";
import { useSavedIds } from "@/lib/design/use-saved-ids";

export interface FeedListingPreviewDrawerProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedListingPreviewDrawer({
  listing,
  open,
  onOpenChange,
}: FeedListingPreviewDrawerProps) {
  const likedIds = useLikedIds();
  const savedIds = useSavedIds();
  const [commentsByListing, setCommentsByListing] = useState<
    Record<string, FakeComment[]>
  >(() => createInitialComments(LISTINGS));
  const [commentLikedIds, setCommentLikedIds] = useState<Set<string>>(
    new Set(),
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );

  const comments: RichComment[] = useMemo(() => {
    if (!listing) return [];
    const raw = commentsByListing[listing.id] ?? [];
    return raw
      .map((c) => ({
        ...c,
        effectiveLikes: c.likes + (commentLikedIds.has(c.id) ? 1 : 0),
      }))
      .sort((a, b) => b.effectiveLikes - a.effectiveLikes);
  }, [listing, commentsByListing, commentLikedIds]);

  const addComment = useCallback(() => {
    if (!listing) return;
    const body = (commentDrafts[listing.id] ?? "").trim();
    if (!body) return;
    setCommentsByListing((prev) => {
      const next: FakeComment = {
        id: `${listing.id}-comment-${Date.now()}`,
        author: VIEWER_COMMENT_AUTHOR,
        avatar: "https://i.pravatar.cc/150?u=me-user",
        body,
        timeLabel: "Just now",
        likes: 0,
      };
      return { ...prev, [listing.id]: [...(prev[listing.id] ?? []), next] };
    });
    setCommentDrafts((prev) => ({ ...prev, [listing.id]: "" }));
  }, [listing, commentDrafts]);

  const toggleCommentLike = useCallback((commentId: string) => {
    setCommentLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  const deleteComment = useCallback((listingId: string, commentId: string) => {
    setCommentsByListing((prev) => ({
      ...prev,
      [listingId]: (prev[listingId] ?? []).filter((c) => c.id !== commentId),
    }));
    setCommentLikedIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    toast.success("Comment deleted");
  }, []);

  if (!listing) return null;

  return (
    <ListingDetailDrawer
      listing={listing}
      open={open}
      onOpenChange={onOpenChange}
      liked={likedIds.has(listing.id)}
      likeCount={listing.likes + (likedIds.has(listing.id) ? 1 : 0)}
      onToggleLike={() => toggleDesignLike(listing.id)}
      saved={savedIds.has(listing.id)}
      onToggleSave={() => toggleSave(listing.id)}
      comments={comments}
      commentLikedIds={commentLikedIds}
      onToggleCommentLike={toggleCommentLike}
      onDeleteComment={(commentId) => deleteComment(listing.id, commentId)}
      commentDraft={commentDrafts[listing.id] ?? ""}
      onCommentDraftChange={(val) =>
        setCommentDrafts((prev) => ({ ...prev, [listing.id]: val }))
      }
      onAddComment={addComment}
    />
  );
}
