# Watch Trading Platform — Design Doc (Evergreen)

> **This is the single source of truth for UX/UI flow.** Update this file whenever a change affects the overall user experience. Where conflicts exist between older docs and this file, this file wins.
>
> Tech stack details live in [HACKATHON_SPEC.md](./HACKATHON_SPEC.md). Nico's day-to-day workflow lives in [NICO_WORK_PLAN.md](./NICO_WORK_PLAN.md).

---

## 01 — Overview & Scope

### Product purpose

A mobile-first, peer-to-peer marketplace for buying and selling watches. Each listing is a single 1-to-1 product post — no auctions, no aggregated lots. The platform is built on Worldbuild Labs infrastructure and uses World ID for seller verification as a core trust signal.

### Why this exists

Online luxury resell marketplaces rely on informal reference-check flows: a seller asks for vouching, previous buyers comment publicly, and the next buyer decides based on that. This breaks down because:

- **Friction** — sellers must repeatedly solicit vouching for every new deal.
- **Fraud** — multiple accounts can launder reputation in both directions.
- **Fragmented identity** — reputation does not travel across Instagram, Facebook, and other channels.

This platform replaces that pattern with a portable, verified identity and a persistent reputation ledger.

### Core design principles

| Principle | What it means |
|---|---|
| **Listing-first UX** | The feed is the default entry point. Every interaction traces back to a listing. |
| **Trust via identity** | World ID verification is a key badge signal. Badge display is compact and non-intrusive. |
| **Seller continuity** | Replying to any listing opens a shared seller thread — enabling bundle conversations without duplication. |
| **Minimal friction** | Posting a listing requires only 3 required fields. Browsing requires no account. |

---

## 02 — Navigation & Global Layout

### Bottom navigation bar

| Tab | Icon (suggested) | Default view | Notes |
|---|---|---|---|
| **Feed** | Home / grid | Default on launch | Chronological listing feed |
| **Messages** | Chat bubble | — | All seller threads, grouped by seller |
| **New Post** | + (center, prominent) | — | Opens listing creation flow |
| **Saved** | Bookmark / heart | — | Liked / saved listings (TBD) |
| **Profile** | Avatar / circle | — | Bottom-right corner |

### Screen inventory

| Screen | Design sandbox URL | Production URL (after merge) | Purpose |
|---|---|---|---|
| Feed | `/design` | `/` | Chronological listing feed — default entry |
| Listing detail | Drawer / sheet over feed | Same | Full listing info, seller card, actions |
| Messages | `/design/messages` (TBD) | `/messages` | Seller-threaded DM inbox |
| Chat thread | — | `/chat/:id` | Single seller conversation |
| New listing | — | `/post` | Create a listing |
| Profile (own) | `/design/profile` | `/profile` | My identity, badges, active listings |
| Profile (other) | `/design/u/[handle]` | `/u/[handle]` | Read-only trust surface for another user |
| Rating | — | `/rate/:userId` | Post-transaction star rating |

---

## 03 — Feed (Landing Page)

### Default behavior

| Property | Spec |
|---|---|
| Default view | Chronological list of all active listings, newest first |
| Post cardinality | 1-to-1 — one post = one product/listing. No bundles at the post level |
| Scroll behavior | Infinite scroll or paginated (TBD). No tabs or category segmentation on initial load |

### Listing card — required elements

- **REQ** — Thumbnail image of the watch (from listing photos)
- **REQ** — Asking price (formatted: "$12,500" or "USD 12,500")
- **REQ** — Seller's display name
- **REQ** — Up to 2 seller badges (see section 04)
- **REQ** — Post title / model name (e.g. "Rolex Submariner 126610LN")
- **OPT** — Truncated description (1–2 lines, expandable via drawer)
- **OPT** — Timestamp / posted date

### Per-card actions

| Action | Trigger | Behavior |
|---|---|---|
| Like | Tap heart on card | Saves listing; increments like count (displayed on card). Requires account. |
| Comment | Tap comment icon on card | Opens a public comment thread on the listing (visible to all). Not a DM. |
| Reply | Tap reply icon on card | Opens/creates a private DM thread with the seller. See section 06 for threading logic. |

> **Visual distinction required:** Comment (public) vs Reply (private DM) must be visually distinct — icon shape, label, or color differentiation to prevent confusion.

### Listing detail drawer

| Property | Spec |
|---|---|
| Trigger | Tap on truncated text or "Read more" affordance on the card |
| Opens | Bottom sheet / drawer sliding up, overlaid on the feed |
| Contents | All photos, complete description, price, seller info, badges, action buttons (Reply, Like, Share) |
| Dismiss | Swipe down, tap handle, or tap outside. Returns to same scroll position in feed |
| Full page option | Drawer includes an "Open listing" link that navigates to a dedicated detail page (deep-linkable URL) |

---

## 04 — Seller Badges

Each listing card shows a maximum of **2 badges**. Display order is prioritized by trust signal weight (World Verified first).

| Badge | Description |
|---|---|
| **World Verified** | Seller's identity verified via World ID (biometric uniqueness proof). Highest trust signal. |
| **Power Seller** | Completed more than X listings (threshold TBD — e.g. 10 or 25 confirmed sales). |
| **TBD Badge 3** | Reserved. Candidates: Fast Responder, Trusted Community Member, category specialist. |
| **TBD Badge 4** | Reserved. Candidates: Long-time Member (account age), Dispute-free seller. |

> **Open question:** Should badges be seller-level (attached to user profile) or listing-level (e.g. "Authenticated by third party")? Recommend seller-level for v1.

---

## 05 — New Listing Flow

### Entry point

Center **+** button in bottom nav. Requires an authenticated account. Unauthenticated users are prompted to sign up / link World ID.

### Fields

- **REQ** — Photo(s): minimum 1 image; support for multiple (TBD: carousel vs gallery)
- **REQ** — Price: numeric input with currency selector (default: USD)
- **REQ** — Model: text field for watch model/reference (e.g. "Rolex Submariner 126610LN"). Used for fuzzy search indexing.
- **REQ** — Description: free text, no hard cap but encourage brevity
- **OPT** — Condition: dropdown — New / Unworn / Excellent / Good / Fair (TBD)
- **OPT** — Box & Papers: toggle — Full Set / Box only / Papers only / None

> **Design intent:** Minimal required fields reduce friction and increase listing velocity. Optional fields surface in an "Add details" expandable section so the form doesn't feel overwhelming.

### Post submission

| Property | Spec |
|---|---|
| On submit | Listing becomes immediately active in feed (no moderation queue for v1, unless World ID not linked) |
| Edit / delete | Seller can edit or remove a listing at any time from Profile > Active Listings |
| Sold marking | Seller can mark as "Sold" — removes from feed but keeps in seller history for badge/reputation tracking |

---

## 06 — Messaging & Reply Threading

### Reply-to-listing behavior

This is the core UX innovation. When a buyer taps "Reply" on any listing from Seller A, the system checks for an existing thread with that seller.

| Scenario | Behavior |
|---|---|
| No existing thread with seller | Creates a new DM thread. Pre-populates first message with listing thumbnail + hyperlink. Buyer adds their message before sending. |
| Existing thread with same seller | Opens existing thread. Appends a new message containing the listing thumbnail hyperlink. Buyer adds their message. Keeps bundle conversations consolidated. |

### Listing thumbnail in messages

| Property | Spec |
|---|---|
| Format | Small image thumbnail + model name + price. Tappable — opens listing drawer or detail page. |
| Stale listings | If listing is marked Sold or deleted, thumbnail shows "Listing ended" state but remains visible in thread history. |
| Thread grouping | Messages tab groups conversations by seller (not by listing). Multiple listing links can appear within one thread. |

### Messages tab

| Property | Spec |
|---|---|
| Layout | Standard DM inbox: conversations sorted by most recent activity. Each row shows seller avatar, name, last message preview. |
| Notification | Unread badge on Messages tab icon when new message is received. |

> **Rationale:** Seller-level threading (vs listing-level) enables natural bundle negotiation — a buyer interested in 3 listings from the same seller has one conversation, each anchored to its relevant listing card.

---

## 07 — Search & Filtering

### Search bar

| Property | Spec |
|---|---|
| Location | Persistent at top of Feed, always visible |
| Type | Fuzzy text search against listing model field and title |
| Behavior | Real-time filtering as user types. Tolerates typos and partial matches (Levenshtein distance ~2–3 chars) |
| Implementation | Recommend fuzzy search library (e.g. Fuse.js client-side for v1, or Algolia/Typesense for scale) |

### Filter controls

| Filter | Input type | Behavior |
|---|---|---|
| Model search | Text (fuzzy) | Primary discovery mechanism (see above) |
| Price range | Dual-handle slider or min/max inputs | Filters feed to listings within selected USD range. Updates in real time. |
| Badges | Multi-select toggle chips | Filter to listings from sellers holding selected badge(s). Filters combine. |

### Filter UX pattern

| Property | Spec |
|---|---|
| Entry | Filter row below search bar. Tapping "Filters" opens a bottom sheet with all controls. |
| Active state | Filter icon shows a dot or count when filters are active. Easy one-tap "Clear all" reset. |
| Persistence | Filters persist within a session; reset on app close (v1). User-saved presets considered for v2. |

---

## 08 — Profile

### Profile sections

| Section | Contents | Version |
|---|---|---|
| Identity | Display name, avatar, member since, bio (optional) | v1 |
| World ID link | Button to connect World ID. Once linked, shows "Verified" state with World logo + checkmark. Unlocks World Verified badge. | v1 |
| Social accounts | Link to Instagram, Twitter/X, Reddit. Displayed as tappable social icons for external trust signal. | v1 |
| Active listings | Grid or list of seller's currently active listings. Tap to edit or mark Sold. | v1 |
| Sales history | Count of completed sales (drives Power Seller badge). Sold listings viewable by seller only (TBD: public). | v2 |
| Reviews / ratings | Buyer-left reviews after completed transaction. | v2 |

### Public vs private profile

| View | Visible content |
|---|---|
| Public (other user) | Name, avatar, World ID badge, social links, active listings, badge display. Read-only. Optional Report/Block. |
| Private (own profile) | All of above + settings, linked accounts management, notification preferences. |

### Reputation signals (on profile)

For each seller, a buyer should be able to see:

- Percentage of positive reviews
- Total number of sales
- Tenure in the app
- World ID verification status

For each buyer, a seller should be able to see:

- Percentage of positive reviews
- Number of purchases
- Tenure in the app

---

## 09 — World ID Integration

| Property | Spec |
|---|---|
| Purpose | Proof-of-personhood. Each real human gets one verification — prevents fake seller accounts / Sybil attacks. |
| Flow | User taps "Link World ID" in Profile > redirected to World app / SDK flow > returns verified state. |
| Badge unlock | World Verified badge immediately applied to all existing and future listings upon verification. |
| Not required to browse | Browsing and searching is open to all. World ID required to: post a listing, message a seller. |

### Locked product rules

- **World ID** is required to **list** and **buy** in the real app. Mocks show verified / not verified as two states.
- **Instagram/Facebook "connected"** is demo only (no real OAuth in design sandbox).
- **Fees:** story is small network gas, not a big app fee. Payment flow is deferred to v2 or WBL-native escrow if available.
- **Public questions** live on listing pages. **Private chat** lives in Messages.

---

## 10 — Design System & Tech Constraints

### UI framework

All product UI is built with **[shadcn/ui](https://ui.shadcn.com/)** on Tailwind CSS. This is non-negotiable for consistency:

- Use shadcn components only (Button, Card, Dialog, Sheet, Input, Badge, Avatar, Skeleton, etc.)
- Do **not** use Material UI, Bootstrap, Chakra, or other frameworks unless explicitly approved
- World MiniKit UI (`@worldcoin/mini-apps-ui-kit-react`) is allowed only for wallet-native flows (pay, verify)

See [HACKATHON_SPEC.md](./HACKATHON_SPEC.md) for full tech stack (Next.js 15, Drizzle, Supabase, NextAuth).

### Figma design tokens

Spacing, typography scale, and color tokens will be pulled from the Figma wireframes file once connected via Figma MCP. Until then, default to shadcn's built-in theme values.

Reference file: [Time Market Wireframes](https://www.figma.com/design/8nL27JY2Lro4BpwrWQGoqm) (7 screens: Feed, Watch Detail, Messages, Chat, Post Watch, Profile, Rating).

### Design sandbox

All UX iteration happens under `/design/*` routes in the browser (localhost, no World App needed). Jae ports finalized layouts to production routes and wires auth + MiniKit. See [NICO_WORK_PLAN.md](./NICO_WORK_PLAN.md) for sandbox URLs and workflow.

---

## 11 — Open Questions

### Badges & trust

- Power Seller threshold — minimum completed sales count? Recommend 10 for v1.
- Badge 3 & 4 — finalize remaining types. Candidates: Fast Responder, Authenticated Seller, Top Rated.
- Seller-level vs listing-level badges — recommend seller-level for v1.

### Feed & listings

- Public comments — visible to all or only buyer + seller? Public creates social signal; private reduces noise.
- Feed sort options beyond chronological — price, relevance, proximity? Defer to v2.
- Listing expiry — auto-expire after N days if not marked Sold?
- Sold listings visibility — public (reputation signal) or seller-only?

### Payments & transactions

- Payment flow — off-platform only in v1? WBL-native escrow if available.
- Fee model — "$0 fee" aspiration vs real network/gas constraints. TBD.
- Off-app sale verification — how to attest without opening abuse vectors.

### Moderation

- Report/flag mechanism on listings — what happens when a World Verified user is flagged for fraud?
- One-account-per-human enforcement — World ID, device signals, manual review.

### World Labs specifics

- Does WBL provide payments / escrow primitives?
- WBL-native notification primitives, or build our own push layer?
- What data lives on-chain vs off-chain? Listing storage? Reputation?

---

## 12 — v1 Scope Summary

| Feature | v1 | v2+ |
|---|---|---|
| Chronological feed with listing cards | **In** | — |
| Like / Comment / Reply on listings | **In** | — |
| Expandable listing drawer | **In** | — |
| Seller-threaded DMs with listing thumbnails | **In** | — |
| New listing (photo, price, model, description) | **In** | — |
| Fuzzy model search | **In** | — |
| Price range filter | **In** | — |
| Badge filter | **In** | — |
| World ID link + World Verified badge | **In** | — |
| Power Seller badge (sales count) | **In** | — |
| Profile: social link integration | **In** | — |
| Profile: active listings view | **In** | — |
| Buyer reviews & ratings | Defer | v2 |
| In-app payment / escrow | Defer | v2 |
| Feed sort options (price, relevance) | Defer | v2 |
| Saved filter presets | Defer | v2 |
| Listing expiry / auto-archive | TBD | — |

---

*Last updated: April 2026. This document is the evergreen UX/UI spec — update it whenever a change affects the overall user flow.*
