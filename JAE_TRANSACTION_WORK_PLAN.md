# Jae Transaction Work Plan

**Goal:** build a real, wired **transaction request** system under the Jae design sandbox first, where a seller can send a payment request inside a private message thread as a **transaction card** tied to a specific listing and amount.

**Important constraint:** this begins on **design routes** first, but it should be built in a way that can later be ported into the real protected app with minimal rewrite.

---

## Scope

This work plan is only for **transaction requests / payment flow inside messaging**.

Included:
- transaction request card inside private chat
- seller-created payment request tied to one watch listing
- amount attached to the transaction request
- backend record linking the message, listing, buyer, seller, and payment reference
- `MiniKit.pay` integration
- payment verification flow
- transaction status updates in chat

Not included:
- escrow smart contracts
- disputes / chargebacks
- shipping / fulfillment workflow
- review UI beyond noting where it plugs in later
- production auth cleanup

---

## Build Location

Build this flow first at:

- ` /design/jae/messages `
- ` /design/jae/messages/[threadId] `

Optional if needed later:

- ` /design/jae/transactions/[id] `

These are sandbox routes, but they should use real app logic where possible:

- real database tables
- real server actions or API routes
- real transaction request creation
- real payment reference creation
- real verification and status updates

The temporary fake part for MVP can still be:

- current-user switching
- seeded test users
- seeded demo listings

---

## Product Definition

A **transaction request** is a structured payment object created by the seller inside a private message thread.

It is **not** just a text message saying “send me $8,500.”

It must:
- reference exactly one listing
- specify exactly one amount
- identify buyer and seller
- render as a message card inside chat
- transition through payment states

The buyer taps the card to pay. The funds move to the seller wallet, and the app links that payment back to the listing and thread using a **server-generated payment reference**.

---

## Core Product Rules

- seller initiates the transaction request
- one transaction request maps to **one listing**
- one transaction request maps to **one buyer + one seller**
- buyer pays seller wallet directly with `MiniKit.pay`
- listing / thread / purchase meaning is stored **off-chain in the app database**
- the on-chain payment is linked back to the app record by **payment reference** and then **tx hash**
- no escrow in MVP
- only one active unpaid request for the same listing in the same thread

---

## Key Design Decision

Do **not** try to encode the listing purchase relationship purely on-chain.

For MVP:

- **money moves on-chain**
- **listing / thread / buyer / seller / request meaning lives in your database**

This means the correct linkage is:

- message card -> `transaction_request_id`
- transaction request -> `listing_id`
- transaction request -> `payment_reference`
- verified payment result -> `tx_hash`

That is how the app knows:

- which watch was being purchased
- who requested it
- who paid
- what amount was intended
- which blockchain transfer satisfied that request

---

## Required UX

### 1. Seller Sends Transaction Request

Inside a thread, seller taps something like:

- `Request payment`

Then seller chooses:

- listing
- amount
- optional note

Result:

- a structured transaction card is inserted into the chat

### 2. Transaction Card In Chat

The card inside the message thread should show:

- listing photo / title
- amount
- seller wallet recipient context
- transaction status
- CTA

Possible CTA labels:

- `Pay now`
- `Processing`
- `Paid`
- `Cancelled`
- `Expired`

### 3. Buyer Payment Flow

Buyer taps `Pay now`.

Flow:

1. app fetches or creates payment reference from backend
2. app launches `MiniKit.pay`
3. app receives payment result
4. backend verifies payment
5. transaction request status updates
6. thread card re-renders with paid state

### 4. Post-Payment UX

After successful payment:

- transaction card becomes read-only
- card shows paid state
- optionally show tx hash preview or “Payment confirmed”
- later this can lead into reviews and deal completion

---

## Typical Crypto Flow For This App

### Phase 1: Seller creates request

Server creates a `transaction_request` row with:

- thread
- listing
- buyer
- seller
- amount
- status = `sent`

Then a structured thread message is created pointing at that request.

### Phase 2: Buyer initiates payment

Buyer taps the transaction card.

Server:

- validates request still payable
- validates buyer is the intended counterparty
- creates payment reference if missing
- returns payment payload

Client:

- calls `MiniKit.pay`

### Phase 3: Payment verification

Backend verifies the payment result using the stored reference.

If verified:

- store tx hash
- mark request `paid`
- mark timestamp

### Phase 4: Deal lifecycle later

Later, this can roll into:

- `completed`
- review prompt
- deal history

But MVP should stop at:

- request sent
- request paid

---

## Data Model

### `transaction_requests`

Fields:

- `id`
- `thread_id`
- `listing_id`
- `seller_user_id`
- `buyer_user_id`
- `seller_wallet`
- `amount`
- `currency`
- `status`
- `payment_reference`
- `tx_hash`
- `note`
- `created_at`
- `updated_at`
- `paid_at` nullable
- `cancelled_at` nullable

Suggested statuses:

- `draft`
- `sent`
- `paying`
- `paid`
- `cancelled`
- `expired`

### `messages`

Messages should support structured types, not just text.

Fields:

- `id`
- `thread_id`
- `sender_user_id`
- `message_type`
- `body`
- `transaction_request_id` nullable
- `created_at`

Suggested `message_type` values:

- `text`
- `transaction_request`
- `system`

### Optional later: `deals`

If you want a broader commerce lifecycle object later:

- `deals` can represent the full trade relationship
- `transaction_requests` can stay the payment-request layer

For MVP, `transaction_requests` is enough.

---

## Why The Listing Should Not Live Only In The Transfer

If a buyer simply sends money to a wallet, the blockchain transfer alone does **not** tell your app:

- which listing was intended
- whether this was for listing A or listing B
- whether it came from the intended buyer
- whether it satisfies the exact requested amount
- whether it belongs to a specific thread card

That is why the app must create a server-side record first and then link the chain payment back to it with a **payment reference**.

This is the core pattern for MVP.

---

## Message Card Shape

The transaction message card should include:

- watch title
- watch preview image
- amount requested
- status badge
- short note if seller added one
- `Pay now` CTA for buyer only

Optional metadata:

- sent by seller
- recipient wallet abbreviated
- created time

---

## API / Backend Flow

### 1. Create transaction request

Endpoint or server action:

- input: `thread_id`, `listing_id`, `amount`, `note`
- validates seller owns / controls the request in this thread
- creates transaction row
- creates corresponding transaction message

### 2. Initiate payment

Endpoint or server action:

- input: `transaction_request_id`
- validates request is still payable
- creates payment reference if missing
- returns payment payload to client

### 3. Verify payment

Endpoint:

- takes payment result
- verifies reference
- stores tx hash
- marks request paid

### 4. Fetch thread

Thread fetch should return:

- normal messages
- transaction messages
- enriched transaction request state for rendering

---

## MVP Acceptance Criteria

This work is complete when:

- seller can create a transaction request from a private thread
- request must reference one listing
- request must contain one amount
- a transaction card appears in the chat
- buyer can tap the card and pay
- backend stores a payment reference before payment begins
- backend verifies payment result afterward
- paid transaction is linked to:
  - thread
  - message card
  - listing
  - buyer
  - seller
- card updates from unpaid to paid state

---

## Recommended Guardrails

- only one active unpaid transaction per listing per thread
- amount is immutable once sent
- paid transaction requests become read-only
- cancelled requests cannot be paid
- buyer must match intended counterparty
- listing should still exist even if later marked inactive

---

## Non-Goals For This Pass

Do not spend time yet on:

- escrow
- multi-party deals
- partial payments
- split payments
- refunds
- disputes
- shipping state tracking
- automatic release conditions
- deep analytics

---

## Handoff Note

Once this is working in the design sandbox:

1. connect real auth instead of fake-user context
2. link “Request payment” from real message threads
3. connect paid transactions into review / reputation flows
4. optionally add a dedicated deal detail screen later

For now, the target is simple:

**seller sends a structured transaction card in chat, buyer pays it, and the app links that payment to the watch by storing the relationship in the backend before the crypto payment starts.**
