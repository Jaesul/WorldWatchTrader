'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

import type { DummyComment } from '@/lib/design-jae-listings-dummy';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  comments: DummyComment[];
};

export function ListingPublicComments({ comments }: Props) {
  const [draft, setDraft] = useState('');

  return (
    <section className="flex flex-col gap-3" aria-labelledby="public-comments-heading">
      <div>
        <h2 id="public-comments-heading" className="text-base font-medium text-foreground">
          Public questions
        </h2>
        <p className="text-sm text-muted-foreground">
          Public questions — everyone can read. Not private messages.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-3">
        <Textarea
          placeholder="Ask a public question…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[88px] resize-none bg-background"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0 opacity-70" aria-hidden />
            Public — visible to everyone
          </p>
          <Button type="button" size="sm" disabled={!draft.trim()}>
            Post public question
          </Button>
        </div>
      </div>

      <Separator />

      <ul className="flex flex-col gap-4">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback>{c.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                <span className="font-medium text-foreground">{c.displayName}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.walletShort}</span>
                <span className="text-xs text-muted-foreground">{c.timeLabel}</span>
              </div>
              <p className="text-sm text-foreground/90">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
