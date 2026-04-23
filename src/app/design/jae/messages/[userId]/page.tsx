'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, SendHorizontal } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  formatDesignJaeMessageTimestamp,
  getDesignJaeActiveMessagingUser,
  getDesignJaeInitials,
  getDesignJaeMessagingUser,
  markDesignJaeConversationRead,
  sendDesignJaeMessage,
  setDesignJaeActiveMessagingUser,
  type DesignJaeConversation,
  type DesignJaeMessagingUserId,
} from '@/lib/design-jae-messages';

function isMessagingUserId(value: string | null): value is DesignJaeMessagingUserId {
  return value === 'marcus' || value === 'nicolas';
}

export default function DesignJaeConversationPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedUser = searchParams.get('as');
  const personId = params.userId;

  const [currentUserId, setCurrentUserId] = useState<DesignJaeMessagingUserId>('marcus');
  const [resolved, setResolved] = useState(false);
  const [conversation, setConversation] = useState<DesignJaeConversation | null>(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextUser = isMessagingUserId(requestedUser)
      ? requestedUser
      : getDesignJaeActiveMessagingUser();

    setCurrentUserId(nextUser);
    setDesignJaeActiveMessagingUser(nextUser);
    setResolved(true);

    if (requestedUser !== nextUser) {
      router.replace(`/design/jae/messages/${personId}?as=${nextUser}`);
    }
  }, [personId, requestedUser, router]);

  const refreshConversation = useCallback(() => {
    if (!isMessagingUserId(personId)) {
      setConversation(null);
      return;
    }
    const nextConversation = markDesignJaeConversationRead(currentUserId, personId);
    setConversation(nextConversation);
  }, [currentUserId, personId]);

  useEffect(() => {
    refreshConversation();
    window.addEventListener('focus', refreshConversation);
    return () => window.removeEventListener('focus', refreshConversation);
  }, [refreshConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conversation?.messages.length]);

  const otherUser = isMessagingUserId(personId) ? getDesignJaeMessagingUser(personId) : null;

  if (!resolved) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 pt-0 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
        <div className="shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 py-3">
          <Card className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Loading conversation…</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!otherUser || !conversation) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 pt-0 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
        <div className="shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Conversation not found</h1>
        </div>
        <div className="min-h-0 flex-1 py-3">
          <Card className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              This Jae sandbox conversation does not exist.
            </p>
            <Link
              href={`/design/jae/messages?as=${currentUserId}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to inbox
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  function handleSend() {
    const body = draft.trim();
    if (!body || !otherUser) return;

    const updatedConversation = sendDesignJaeMessage({
      senderUserId: currentUserId,
      recipientUserId: otherUser.id,
      body,
    });

    if (updatedConversation) {
      setDraft('');
      setConversation(markDesignJaeConversationRead(currentUserId, otherUser.id));
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 pt-0 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
      <div className="shrink-0 pb-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 shrink-0"
            onClick={() => router.push(`/design/jae/messages?as=${currentUserId}`)}
            aria-label="Back to inbox"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Avatar className="size-11 bg-foreground/10">
                <AvatarFallback>{getDesignJaeInitials(otherUser.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">{otherUser.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{otherUser.handle} · {otherUser.walletStub}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="flex flex-col gap-3">
            {conversation.messages.map((message) => {
              const isCurrentUser = message.senderUserId === currentUserId;
              const sender = getDesignJaeMessagingUser(message.senderUserId);

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2">
                      {!isCurrentUser ? (
                        <Avatar className="size-7 bg-foreground/10">
                          <AvatarFallback>{getDesignJaeInitials(sender.displayName)}</AvatarFallback>
                        </Avatar>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {isCurrentUser ? 'You' : sender.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDesignJaeMessageTimestamp(message.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isCurrentUser
                          ? 'rounded-br-md bg-foreground text-background'
                          : 'rounded-bl-md bg-muted text-foreground'
                      }`}
                    >
                      {message.body}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background py-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${otherUser.displayName.split(' ')[0]}...`}
            className="min-h-12 flex-1 resize-none bg-background"
          />
          <Button
            type="button"
            className="shrink-0 rounded-full px-4"
            onClick={handleSend}
            disabled={!draft.trim()}
          >
            <SendHorizontal className="size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
