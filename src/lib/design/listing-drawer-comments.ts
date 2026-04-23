import type { Listing } from "@/lib/design/data";
import { getAddress, isAddress } from "viem";

/** Compare user ids (wallet addresses may differ only by checksum). */
export function sameWalletUserId(a: string, b: string): boolean {
  if (a === b) return true;
  if (isAddress(a) && isAddress(b)) {
    try {
      return getAddress(a as `0x${string}`) === getAddress(b as `0x${string}`);
    } catch {
      return false;
    }
  }
  return false;
}

/** Display name for comments posted by the current user in design surfaces. */
export const VIEWER_COMMENT_AUTHOR = "You" as const;

export type FakeComment = {
  id: string;
  author: string;
  avatar: string;
  body: string;
  timeLabel: string;
  likes: number;
  /** Set when the row comes from `listing_comments`; used with the design viewer for delete. */
  authorUserId?: string;
};

export type RichComment = FakeComment & { effectiveLikes: number };

export function buildFakeComments(listing: Listing): FakeComment[] {
  return [
    {
      author: "Marco K.",
      avatar: "https://i.pravatar.cc/150?u=marco-k",
      body: `Is the ${listing.model} still available, and are there any scratches on the clasp?`,
      timeLabel: "14m ago",
      likes: 7,
    },
    {
      author: "Nina P.",
      avatar: "https://i.pravatar.cc/150?u=nina-p",
      body: `Love this one. ${listing.boxPapers} and ${listing.condition.toLowerCase()} makes it really compelling.`,
      timeLabel: "39m ago",
      likes: 12,
    },
    {
      author: "Samir T.",
      avatar: "https://i.pravatar.cc/150?u=samir-t",
      body: `Would you consider a trade plus cash, or are you only looking for a straight sale?`,
      timeLabel: "1h ago",
      likes: 4,
    },
    {
      author: "Jess A.",
      avatar: "https://i.pravatar.cc/150?u=jess-a",
      body: `Can you share a movement shot and maybe a quick lume photo in messages?`,
      timeLabel: "3h ago",
      likes: 9,
    },
    {
      author: "Theo R.",
      avatar: "https://i.pravatar.cc/150?u=theo-r",
      body: `Price feels fair for a ${listing.condition.toLowerCase()} example. Curious how much traction you've had so far.`,
      timeLabel: "5h ago",
      likes: 3,
    },
  ].map((c, i) => ({ id: `${listing.id}-comment-${i + 1}`, ...c }));
}

export function createInitialComments(
  listings: Listing[],
): Record<string, FakeComment[]> {
  return Object.fromEntries(
    listings.map((l) => [l.id, buildFakeComments(l)]),
  ) as Record<string, FakeComment[]>;
}

export function commentInitials(name: string) {
  const parts = name.split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function isViewerAuthoredComment(
  comment: Pick<FakeComment, "author" | "authorUserId">,
  viewerUserId?: string | null,
): boolean {
  if (comment.author === VIEWER_COMMENT_AUTHOR) return true;
  if (viewerUserId && comment.authorUserId) {
    return sameWalletUserId(comment.authorUserId, viewerUserId);
  }
  return false;
}
