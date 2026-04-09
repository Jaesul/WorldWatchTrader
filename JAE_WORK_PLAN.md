# Jae — work plan (Listings, Messages, Pay wiring)

## Who is doing what

| Person | Role | What they own in this project |
|--------|------|--------------------------------|
| **Jae** | SWE (+ UX prompts for **your** surfaces) | **Marketplace core:** **Listings** (discover watches, create a post, open a post, **public** Q&A on the post), **private Messages** (DM threads), **MiniKit pay** to seller, **deals + reviews** in the database, and wiring that powers **reputation numbers** on [Nico’s profile screens](./NICO_WORK_PLAN.md). You work in **real app routes** (`/listings`, `/messages`, …) with auth / World when needed, and you **port** Nico’s **`/design/*`** UI into production when integrating. |
| **Nico** | UX (prompts) | **Landing, Home, My profile, Other people’s profiles** — all iterated on **`/design/*`** in localhost only. See [Nico’s work plan](./NICO_WORK_PLAN.md). |

**Handoff:** Nico’s prompts → you implement with **shadcn** under `src/app/design/*` first (optional fast path), then merge layouts into `(protected)` / `/` and connect **MiniKit**, **NextAuth**, **Supabase/Drizzle**.

---

## Locked product rules

- **World ID** required to **create listing** and to **pay** (enforce server-side).
- **Direct `MiniKit.pay`** to seller; **escrow** = stretch only.
- **Fees:** near-zero app fee; users see **network gas only** in copy.
- **Listing comments = public.** **Messages = private** (not the same UI as comments).
- **Reputation data** you store powers **Profile** — coordinate schema early with Nico’s display needs.

---

## Purpose of each page (what it’s for)

| Route | **Purpose** | Richer context |
|-------|-------------|----------------|
| **`/listings`** | **Discovery** — the catalog of watches for sale | Buyers scan **trust + desirability at a glance** (title, teaser, seller hint, optional price). This is the main “shop floor.” Empty state matters for early hackathon demos. |
| **`/listings/new`** | **Supply** — seller creates a post | Captures **title + details** (and optional fields). Gated: **World ID required** before submit. Needs clear **blocked** state + CTA to verify. Success should route somewhere sensible (e.g. new listing or browse). |
| **`/listings/[id]`** | **Decision surface** — one watch, one deal context | Hero + full description + **seller block** (tap → **Nico’s** other-user profile `/u/...`). **Pay** CTA lives here (after verify). **Public comments** = **everyone can read** — Q&A, not DMs. |
| **Public comments** (on listing detail) | **Transparent Q&A** | Same as Facebook Marketplace **public** questions. **Not** private chat (that’s Messages). One composer + thread; label must say it’s public. |
| **`/messages`** | **Private inbox** | List of **1:1 threads** with another wallet/user. Used for negotiation and logistics **without** exposing thread to the world. |
| **`/messages/[threadId]`** (when built) | **Private conversation** | Bubble UI + composer. Subtitle should reinforce **private** vs listing comments. |
| **Pay flow** (from listing) | **Commit money** — direct to seller | **MiniKit.pay** in World App; your **shadcn** shells for confirm/summary. **World ID required** to pay. After pay, **deal + review** data feeds **Nico’s reputation** UI. |
| **Reviews** (after pay) | **Reputation input** | One review per deal (or your chosen rule). Aggregates show on **profiles** — coordinate fields (stars vs thumbs) with Nico. |

**Nico** does **not** own these routes day-to-day; he works on **`/design/*`**. You implement his **profile** work there first, then port. For **listings/messages**, you own prompts + code on **`/listings`**, **`/messages`**, etc.

**Stubs today:** sign in (when using protected stack) → bottom tabs **Listings** & **Messages**. From Listings, use **Add listing** and **Example listing** links.

---

## UI — shadcn for product surfaces

- Build **listings, comments, messages, and surrounding chrome** with **shadcn/ui** (`src/components/ui/*`). Prompt LLMs with **“use shadcn only”** — not MUI, Bootstrap, Chakra, etc.
- **World kit / MiniKit** is OK where the platform owns the flow (e.g. pay sheet). If a generated screen **looks wrong**, ask: **is this shadcn?** and refactor to shadcn primitives.

---

## UX — Prompt pack 1: Listings + public comments

```text
Design Listings (mobile mini app, luxury watches).

Implementation constraint: **shadcn/ui components only** for UI (Card, Button, Input, Textarea, Badge, Dialog, Avatar, ScrollArea, etc.). Do not use other UI libraries.

1) BROWSE (/listings)
   - Card: title, teaser, seller hint, optional price
   - Loading / error copy

2) DETAIL (/listings/[id])
   - Hero, title, full details, seller block → tap to profile (Nico’s /u/...)
   - Primary CTA: Pay (later) / “Verify to buy” if unverified
   - Section title for PUBLIC comments (“Public questions — everyone can read”)

3) NEW LISTING (/listings/new)
   - Fields: title, details textarea; optional condition, model #
   - Success: where to navigate + message
   - Blocked if not World ID verified: screen + CTA

4) COMMENTS
   - Composer placeholder, submit label
   - Row: initial, short name/wallet, time
   - One line: “Public — visible to everyone”

Output: copy + component list in plain English.
```

## SWE checklist — Listings MVP

- [ ] Drizzle schema: `listings`, `listing_comments` (author wallet, body, timestamps).
- [ ] API routes or server actions; **reject create** if not verified.
- [ ] Replace stubs with real UI per prompt pack (**shadcn**; add components via `npx shadcn@latest add …`).
- [ ] Link **Message seller** when Messages MVP exists (does not post to comments).

---

## UX — Prompt pack 2: Private messaging

```text
Design PRIVATE messaging (not listing comments).

Implementation constraint: **shadcn/ui only** for inbox and thread UI.

1) INBOX (/messages)
   - Thread list: name, preview, time
   - Empty state copy + CTA

2) THREAD (/messages/[threadId])
   - Bubbles, input, send
   - Subtitle: “Private between you and [name]”

3) FROM LISTING
   - “Message seller” opens/creates thread; clarify NOT public comment

Output: copy + navigation between screens.
```

## SWE checklist — Messages MVP

- [ ] Schema: `threads`, `messages`, participants (by wallet).
- [ ] Inbox + thread pages (**shadcn**); polling OK for hackathon.
- [ ] Entry from listing detail.

---

## UX — Prompt pack 3: Pay + fee copy

```text
Pay seller in World App (MiniKit.pay).

Surrounding summary screens / modals: **shadcn/ui** (Dialog, Card, Button). Native pay sheet may stay World/MiniKit.

1) Pre-pay summary: listing, amount, seller, fee line: “Small network fee only; no app fee.”
2) Confirm / success / failure strings
3) Success → “Leave a review” CTA
4) STRETCH paragraph: future escrow (readme only)

Output: every user-visible string in the pay path.
```

## SWE checklist — Pay + deals

- [ ] `MiniKit.pay` from listing flow; **block** if buyer not verified.
- [ ] Deal row keyed by payment `reference` (idempotent).
- [ ] Escrow **not** in MVP code.

---

## UX — Prompt pack 4: Reviews (after pay)

Use Tier 4 **leave review** section from [`TEAM_WORK_PLAN.md`](./TEAM_WORK_PLAN.md). Reviews show on **Nico’s profile** aggregates — agree on fields (stars vs thumbs).

## SWE checklist — Reviews + aggregates

- [ ] `deals`, `reviews` (or equivalent); unique constraint per deal/pair rule.
- [ ] Expose aggregates for Profile (Nico’s SWE tasks).

---

## URL map (your pages)

| Path | Role |
|------|------|
| `/listings` | Browse — discovery |
| `/listings/new` | Create listing — seller supply |
| `/listings/[id]` | Detail — decide + public Q&A + pay entry |
| `/messages` | Inbox — private threads |
| `/messages/[threadId]` | Thread — private chat |

---

## Merge points with Nico

- **World ID verified** flag: one source of truth; both UIs read it.
- **Fee wording:** reuse Nico’s one-liner if they supply it; else ship yours and Nico aligns Profile copy.
- **Profile deep links** from listing seller block → `/u/...` when route exists.
