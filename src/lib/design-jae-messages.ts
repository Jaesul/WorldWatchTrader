export type DesignJaeMessagingUserId = 'marcus' | 'nicolas';

export type DesignJaeMessagingUser = {
  id: DesignJaeMessagingUserId;
  displayName: string;
  handle: string;
  walletStub: string;
  roleLabel: string;
};

export type DesignJaeConversationMessage = {
  id: string;
  senderUserId: DesignJaeMessagingUserId;
  body: string;
  createdAt: string;
};

export type DesignJaeConversation = {
  id: string;
  participantIds: [DesignJaeMessagingUserId, DesignJaeMessagingUserId];
  updatedAt: string;
  messages: DesignJaeConversationMessage[];
  lastReadAt: Record<DesignJaeMessagingUserId, string | null>;
};

type DesignJaeMessagingStore = {
  conversations: DesignJaeConversation[];
};

export const DESIGN_JAE_MESSAGING_USERS: Record<
  DesignJaeMessagingUserId,
  DesignJaeMessagingUser
> = {
  marcus: {
    id: 'marcus',
    displayName: 'Marcus Chen',
    handle: 'watchvault',
    walletStub: '0x71C3...9A3E',
    roleLabel: 'Seller demo account',
  },
  nicolas: {
    id: 'nicolas',
    displayName: 'Nicolas Rivera',
    handle: 'horology_nico',
    walletStub: '0x8A2F...C901',
    roleLabel: 'Buyer demo account',
  },
};

export const DESIGN_JAE_MESSAGING_USER_OPTIONS = [
  DESIGN_JAE_MESSAGING_USERS.marcus,
  DESIGN_JAE_MESSAGING_USERS.nicolas,
] as const;

export const DESIGN_JAE_MESSAGES_ACTIVE_USER_KEY = 'design-jae-messages-active-user';

const STORE_KEY = 'design-jae-messages-store-v2';

const SEEDED_STORE: DesignJaeMessagingStore = {
  conversations: [
    {
      id: 'marcus__nicolas',
      participantIds: ['marcus', 'nicolas'],
      updatedAt: '2026-04-11T14:12:00.000Z',
      messages: [
        {
          id: 'msg-1',
          senderUserId: 'nicolas',
          body: 'Hey Marcus, still around today? Wanted to follow up on the watches you posted.',
          createdAt: '2026-04-11T13:36:00.000Z',
        },
        {
          id: 'msg-2',
          senderUserId: 'marcus',
          body: 'Yep, around all afternoon. Happy to talk through whichever piece you are serious about.',
          createdAt: '2026-04-11T13:39:00.000Z',
        },
        {
          id: 'msg-3',
          senderUserId: 'nicolas',
          body: 'Mainly the Datejust and the Speedmaster. I can move quickly if the numbers make sense.',
          createdAt: '2026-04-11T13:52:00.000Z',
        },
        {
          id: 'msg-4',
          senderUserId: 'marcus',
          body: 'Sounds good. Let me know which one you want to focus on first and I can line up payment next.',
          createdAt: '2026-04-11T14:12:00.000Z',
        },
      ],
      lastReadAt: {
        marcus: '2026-04-11T14:12:00.000Z',
        nicolas: '2026-04-11T13:52:00.000Z',
      },
    },
  ],
};

function cloneSeedStore(): DesignJaeMessagingStore {
  return structuredClone(SEEDED_STORE);
}

function isUserId(value: string | null): value is DesignJaeMessagingUserId {
  return value === 'marcus' || value === 'nicolas';
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getConversationIdForUsers(
  userA: DesignJaeMessagingUserId,
  userB: DesignJaeMessagingUserId,
): string {
  return [userA, userB].sort().join('__');
}

function readStore(): DesignJaeMessagingStore {
  if (!isBrowser()) {
    return cloneSeedStore();
  }

  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const seeded = cloneSeedStore();
    writeStore(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as DesignJaeMessagingStore;
    if (!parsed?.conversations || !Array.isArray(parsed.conversations)) {
      throw new Error('Invalid design Jae message store');
    }
    return parsed;
  } catch {
    const seeded = cloneSeedStore();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(store: DesignJaeMessagingStore): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getDesignJaeMessagingUser(
  userId: DesignJaeMessagingUserId,
): DesignJaeMessagingUser {
  return DESIGN_JAE_MESSAGING_USERS[userId];
}

export function getDesignJaeActiveMessagingUser(): DesignJaeMessagingUserId {
  if (!isBrowser()) return 'marcus';
  const stored = window.localStorage.getItem(DESIGN_JAE_MESSAGES_ACTIVE_USER_KEY);
  return isUserId(stored) ? stored : 'marcus';
}

export function setDesignJaeActiveMessagingUser(userId: DesignJaeMessagingUserId): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(DESIGN_JAE_MESSAGES_ACTIVE_USER_KEY, userId);
}

export function getDesignJaeConversationPartners(
  userId: DesignJaeMessagingUserId,
): DesignJaeMessagingUserId[] {
  return readStore()
    .conversations.filter((conversation) => conversation.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((conversation) => getDesignJaeOtherParticipantId(conversation, userId));
}

export function getDesignJaeConversation(
  userId: DesignJaeMessagingUserId,
  otherUserId: DesignJaeMessagingUserId,
): DesignJaeConversation | null {
  const conversationId = getConversationIdForUsers(userId, otherUserId);
  return readStore().conversations.find((entry) => entry.id === conversationId) ?? null;
}

export function getDesignJaeOtherParticipantId(
  conversation: DesignJaeConversation,
  userId: DesignJaeMessagingUserId,
): DesignJaeMessagingUserId {
  return (
    conversation.participantIds.find((participantId) => participantId !== userId) ?? userId
  );
}

export function markDesignJaeConversationRead(
  userId: DesignJaeMessagingUserId,
  otherUserId: DesignJaeMessagingUserId,
): DesignJaeConversation | null {
  const store = readStore();
  const conversationId = getConversationIdForUsers(userId, otherUserId);
  const conversation = store.conversations.find((entry) => entry.id === conversationId);

  if (!conversation) {
    return null;
  }

  const latestTimestamp = conversation.messages.at(-1)?.createdAt ?? conversation.updatedAt;
  conversation.lastReadAt[userId] = latestTimestamp;
  writeStore(store);
  return conversation;
}

export function sendDesignJaeMessage(args: {
  senderUserId: DesignJaeMessagingUserId;
  recipientUserId: DesignJaeMessagingUserId;
  body: string;
}): DesignJaeConversation | null {
  const store = readStore();
  const conversationId = getConversationIdForUsers(args.senderUserId, args.recipientUserId);
  const conversation = store.conversations.find((entry) => entry.id === conversationId);

  if (!conversation) {
    return null;
  }

  const createdAt = new Date().toISOString();
  const nextMessage: DesignJaeConversationMessage = {
    id: globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}`,
    senderUserId: args.senderUserId,
    body: args.body.trim(),
    createdAt,
  };

  conversation.messages.push(nextMessage);
  conversation.updatedAt = createdAt;
  conversation.lastReadAt[args.senderUserId] = createdAt;
  writeStore(store);
  return conversation;
}

export function getDesignJaeUnreadCount(
  conversation: DesignJaeConversation,
  userId: DesignJaeMessagingUserId,
): number {
  const lastReadAt = conversation.lastReadAt[userId];
  if (!lastReadAt) {
    return conversation.messages.filter((message) => message.senderUserId !== userId).length;
  }

  return conversation.messages.filter(
    (message) => message.senderUserId !== userId && message.createdAt > lastReadAt,
  ).length;
}

export function formatDesignJaeMessageTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDesignJaeRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function getDesignJaeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
