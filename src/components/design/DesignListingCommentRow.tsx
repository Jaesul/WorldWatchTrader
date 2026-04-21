"use client";

import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  commentInitials,
  isViewerAuthoredComment,
  type RichComment,
} from "@/lib/design/listing-drawer-comments";
import { cn } from "@/lib/utils";

export function DesignListingCommentRow({
  comment,
  liked,
  onToggleLike,
  onDelete,
  variant,
}: {
  comment: RichComment;
  liked: boolean;
  onToggleLike: () => void;
  /** When set for a viewer-authored comment, shows delete + confirmation. */
  onDelete?: () => void;
  variant: "feed" | "drawer";
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isFeed = variant === "feed";
  const canDelete = isViewerAuthoredComment(comment) && onDelete;

  function confirmDelete() {
    onDelete?.();
    setConfirmOpen(false);
  }

  return (
    <>
      <div
        className={cn("flex items-start", isFeed ? "gap-2" : "gap-3")}
        data-comment-id={comment.id}
      >
        <Avatar
          className={cn(
            "mt-0.5 shrink-0 bg-foreground text-background after:border-foreground/10",
            isFeed ? "size-6" : "size-8",
          )}
        >
          <AvatarImage src={comment.avatar} alt={comment.author} />
          <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
            {commentInitials(comment.author).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className={cn(isFeed ? "text-xs" : "text-sm")}>
            <span className="font-semibold text-foreground">
              {comment.author}
            </span>{" "}
            <span
              className={cn(
                isFeed ? "text-foreground/75" : "text-foreground/80",
              )}
            >
              {comment.body}
            </span>
          </p>
          <div
            className={cn(
              "mt-1 flex flex-wrap items-center",
              isFeed ? "gap-2" : "gap-3",
            )}
          >
            <span
              className={cn(
                "text-muted-foreground",
                isFeed ? "text-[10px]" : "text-[11px]",
              )}
            >
              {comment.timeLabel}
            </span>
            <button
              type="button"
              onClick={onToggleLike}
              className={cn(
                "flex items-center font-medium transition-colors",
                isFeed
                  ? "gap-0.5 text-[10px]"
                  : "gap-1 text-[11px]",
                liked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={liked ? "Unlike comment" : "Like comment"}
            >
              <Heart
                className={cn(isFeed ? "size-3" : "size-3.5", liked && "fill-current")}
              />
              {comment.effectiveLikes}
            </button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "text-muted-foreground hover:text-destructive",
                  isFeed && "size-7 min-h-7 min-w-7",
                )}
                aria-label="Delete comment"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className={isFeed ? "size-3.5" : "size-4"} />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {canDelete ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes your comment from the listing thread.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
