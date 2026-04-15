# Jae Messaging Work Plan

**Goal:** build a real, wired messaging system under the Jae design sandbox first, while using **two fake accounts** so messaging can be tested end-to-end before full auth/user wiring is ready.

**Important constraint:** for now this work happens on **design routes** first, but it should be built in a way that can later be ported into the real protected app with minimal rewrite.

---

## Scope

This work plan is only for **messaging**.

Included:
- inbox screen
- thread screen
- message composer
- real persistence / real app wiring
- two seeded fake users for local testing
- a **dropdown user switcher** so we can instantly change who we are

Not included:
- listings
- pay flow
- public comments
- reviews / reputation aggregation
- final production auth integration

---

## Build Location

Build messaging first at:

- ` /design/jae/messages `
- ` /design/jae/messages/[threadId] `

These are the sandbox routes, but they should use real app logic where possible:

- real database tables
- real server actions or API routes
- real thread/message creation
- real read/write state

The only fake part for MVP is **who the current user is**.

---

## Product Definition

Messaging is **private 1:1 chat** between two users.

For the first workable version:
- support exactly **two fake local users**
- allow switching between them from a **dropdown**
- messages should persist so one user can send and the other can read after switching
- the experience should feel like a real inbox, not just a static prototype

---

## Fake Accounts For MVP

Seed two fake accounts in the database or local app seed layer:

1. **Marcus Chen**
   - handle: `watchvault`
   - wallet stub: `0x71C3...9A3E`
   - role in demo: seller / high-volume user

2. **Nicolas Rivera**
   - handle: `horology_nico`
   - wallet stub: `0x8A2F...C901`
   - role in demo: buyer / second participant

Requirements:
- both users must be able to message each other
- both users must appear in thread metadata
- switching users must immediately update inbox/thread state as that person

---

## Required UX

### 1. User Switcher

Add a dropdown at the top of the messaging sandbox:

- label: `Viewing as`
- options:
  - `Marcus Chen`
  - `Nicolas Rivera`

Rules:
- selected value determines current user context
- current user context drives:
  - inbox thread list
  - message alignment
  - composer sender
  - unread state
- this should be intentionally temporary dev UX, but clean enough to demo

### 2. Inbox

Route: ` /design/jae/messages `

Show:
- thread partner name
- latest message preview
- timestamp
- unread indicator

Needs:
- empty state if no threads exist
- button or action to open a thread
- thread list should update after sending messages

### 3. Thread

Route: ` /design/jae/messages/[threadId] `

Show:
- other participant name
- clear private messaging label
- chronological messages
- sent vs received styling
- composer with send action

Needs:
- persisted messages
- optimistic feel if possible
- mobile-friendly layout

---

## Data Model

Minimum schema:

### `users` or equivalent local identity table
- `id`
- `display_name`
- `handle`
- `wallet_stub`
- `avatar_url` optional

### `message_threads`
- `id`
- `created_at`
- `updated_at`

### `message_thread_participants`
- `thread_id`
- `user_id`

### `messages`
- `id`
- `thread_id`
- `sender_user_id`
- `body`
- `created_at`
- optional `read_at`

Notes:
- keep schema generic so fake users can later be replaced by real app users
- do not hardcode the fake-user logic into the database schema itself
- the fake-user logic should live at the session/dev-selection layer

---

## App Wiring Plan

### Phase 1: Seed and identity switching
- add two fake users
- create a simple current-user selector for design routes
- persist selected user in query param, cookie, or local storage

### Phase 2: Inbox and thread reads
- fetch threads for selected user
- fetch messages for selected thread
- show partner identity correctly

### Phase 3: Sending messages
- composer writes a real message row
- thread `updated_at` refreshes
- inbox ordering updates

### Phase 4: Demo polish
- unread marker
- empty state copy
- mobile spacing
- thread preview formatting

---

## Technical Decisions

### Current user selection

Preferred temporary approach:
- use a **dropdown selector**
- store selected fake user in:
  - search params, or
  - cookie, or
  - local storage

Recommendation:
- use a **query param + server-friendly fallback** if easy
- otherwise use a client-side persisted selector for speed

### Read/write layer

Use one real path for messaging:
- server actions, or
- route handlers

Do not make the design sandbox a dead-end mock if avoidable.

### Seeding

Need:
- one seeded thread between Marcus and Nicolas
- several seeded dummy messages so the UI looks alive immediately

---

## Seed Content

Seed at least:

- 1 existing thread between Marcus and Nicolas
- 6 to 10 starter messages

Example themes:
- watch availability
- condition questions
- shipping timing
- local meetup vs insured shipping

This gives us:
- realistic inbox preview text
- realistic thread density
- something to test user switching against

---

## Acceptance Criteria

This work is complete when:

- ` /design/jae/messages ` shows a real inbox
- ` /design/jae/messages/[threadId] ` shows a real thread
- a dropdown lets us switch between Marcus and Nicolas
- messages persist after sending
- Marcus can send to Nicolas
- Nicolas can switch in and see the message from his side
- seeded dummy messages exist for demo quality
- the implementation is structured so later auth wiring can replace the fake user selector

---

## Non-Goals For This Pass

Do not spend time yet on:
- group chat
- attachments
- typing indicators
- push notifications
- read receipts beyond optional simple `read_at`
- blocking / reporting
- production auth cleanup

---

## Handoff Note

Once this is working in the design sandbox:

1. replace fake-user dropdown with real auth identity
2. port the same messaging flow into the protected app routes
3. connect entry points from listings and seller actions

For now, the target is simple:

**real messaging behavior + fake selectable users + design-route-first delivery.**
