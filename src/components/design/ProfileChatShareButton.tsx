'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

type ProfileChatShareButtonProps = {
  profileSlug: string;
  username: string;
};

function profileUrlFromSlug(profileSlug: string): string {
  if (typeof window === 'undefined') return `/u/${encodeURIComponent(profileSlug)}`;
  const path = `/u/${encodeURIComponent(profileSlug)}`;
  return new URL(path, window.location.origin).toString();
}

export function ProfileChatShareButton({
  profileSlug,
  username,
}: ProfileChatShareButtonProps) {
  async function onShare() {
    const profileUrl = profileUrlFromSlug(profileSlug);
    const message = `Check out @${username} on WorldWatchTrader: ${profileUrl}`;

    try {
      const result = await MiniKit.chat({
        message,
        fallback: async () => {
          try {
            if (typeof navigator === 'undefined' || !navigator.clipboard) {
              throw new Error('clipboard unavailable');
            }
            await navigator.clipboard.writeText(message);
            toast.success('Copied share text');
          } catch {
            toast.error('Couldn’t copy share text');
          }
        },
      });
      if (result.executedWith === 'minikit') {
        toast.success('Opened World Chat');
      }
    } catch {
      toast.error('Couldn’t open World Chat');
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Share profile in World Chat"
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Share2 className="size-3" strokeWidth={2} />
      <span>Share</span>
    </button>
  );
}
