'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/PageLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DESIGN_JAE_MESSAGING_USER_OPTIONS,
  formatDesignJaeRelativeTime,
  getDesignJaeActiveMessagingUser,
  getDesignJaeConversation,
  getDesignJaeConversationPartners,
  getDesignJaeInitials,
  getDesignJaeMessagingUser,
  getDesignJaeUnreadCount,
  setDesignJaeActiveMessagingUser,
  type DesignJaeMessagingUserId,
} from '@/lib/design-jae-messages';

function isMessagingUserId(value: string | null): value is DesignJaeMessagingUserId {
  return value === 'marcus' || value === 'nicolas';
}

function DesignJaeMessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedUser = searchParams.get('as');

  const [currentUserId, setCurrentUserId] = useState<DesignJaeMessagingUserId>('marcus');
  const [resolved, setResolved] = useState(false);
  const [partnerIds, setPartnerIds] = useState<DesignJaeMessagingUserId[]>([]);

  useEffect(() => {
    const nextUser = isMessagingUserId(requestedUser)
      ? requestedUser
      : getDesignJaeActiveMessagingUser();

    setCurrentUserId(nextUser);
    setDesignJaeActiveMessagingUser(nextUser);
    setResolved(true);

    if (requestedUser !== nextUser) {
      router.replace(`/design/jae/messages?as=${nextUser}`);
    }
  }, [requestedUser, router]);

  const refreshConversations = useCallback(() => {
    setPartnerIds(getDesignJaeConversationPartners(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    refreshConversations();
    window.addEventListener('focus', refreshConversations);
    return () => window.removeEventListener('focus', refreshConversations);
  }, [refreshConversations]);

  const currentUser = useMemo(
    () => getDesignJaeMessagingUser(currentUserId),
    [currentUserId],
  );

  if (!resolved) {
    return (
      <Page className="min-h-0">
        <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
          <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        </Page.Header>
        <Page.Main className="flex flex-col gap-4 px-4 pb-8">
          <Card className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Loading inbox…</p>
          </Card>
        </Page.Main>
      </Page>
    );
  }

  return (
    <Page className="min-h-0 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]">
      <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Person-based inbox for the Jae sandbox. Switch identities below to test both sides.
          </p>
        </div>
      </Page.Header>

      <Page.Main className="flex flex-col gap-4 px-4 pb-8">
        <Card className="gap-3 border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Viewing as</p>
              <p className="text-xs text-muted-foreground">
                Temporary dev switcher for the seeded Jae messaging users.
              </p>
            </div>
            <select
              value={currentUserId}
              onChange={(event) => {
                const nextUser = event.target.value as DesignJaeMessagingUserId;
                setCurrentUserId(nextUser);
                setDesignJaeActiveMessagingUser(nextUser);
                router.replace(`/design/jae/messages?as=${nextUser}`);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Select current test user"
            >
              {DESIGN_JAE_MESSAGING_USER_OPTIONS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3">
            <Avatar className="size-10 bg-foreground/10">
              <AvatarFallback>{getDesignJaeInitials(currentUser.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{currentUser.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{currentUser.handle} · {currentUser.walletStub}
              </p>
            </div>
          </div>
        </Card>

        {partnerIds.length === 0 ? (
          <Card className="items-center px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Seed a conversation or send the first message once seller-entry flows exist.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {partnerIds.map((otherUserId) => {
              const otherUser = getDesignJaeMessagingUser(otherUserId);
              const conversation = getDesignJaeConversation(currentUserId, otherUserId);
              const lastMessage = conversation?.messages.at(-1);
              const unreadCount = conversation
                ? getDesignJaeUnreadCount(conversation, currentUserId)
                : 0;

              return (
                <Link
                  key={otherUserId}
                  href={`/design/jae/messages/${otherUserId}?as=${currentUserId}`}
                  className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="gap-3 px-4 py-4 transition-colors hover:bg-muted/20">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 bg-foreground/10">
                        <AvatarFallback>{getDesignJaeInitials(otherUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {otherUser.displayName}
                              </p>
                              <span className="text-xs text-muted-foreground">@{otherUser.handle}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {otherUser.roleLabel}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {conversation ? formatDesignJaeRelativeTime(conversation.updatedAt) : ''}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-border/70 bg-muted/30 text-xs">
                            Direct messages
                          </Badge>
                          {unreadCount > 0 ? (
                            <Badge variant="brand" className="text-xs">
                              {unreadCount} new
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1 truncate text-sm text-foreground/85">
                          {lastMessage ? lastMessage.body : `Start a conversation with ${otherUser.displayName}.`}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Page.Main>
    </Page>
  );
}

export default function DesignJaeMessagesPage() {
  return (
    <Suspense
      fallback={
        <Page className="min-h-0">
          <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          </Page.Header>
          <Page.Main className="flex flex-col gap-4 px-4 pb-8">
            <Card className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">Loading inbox…</p>
            </Card>
          </Page.Main>
        </Page>
      }
    >
      <DesignJaeMessagesPageContent />
    </Suspense>
  );
}
