# Team work plan — UX (prompts) + SWE

## Split by person (who works on what)


| Partner  | Scope                                                                                                                                   | Why it’s split this way                                                                                                                                              | Doc                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Nico** | **Landing** (story + entry), **Home** (hub after “I’m in”), **My profile** vs **other people’s profiles** (trust + identity)            | All of this is **browser-only** on `**/design/*`** so Nico never needs World App, ngrok, or sign-in to iterate. He owns **first impression** and **who is who**.     | `[NICO_WORK_PLAN.md](./NICO_WORK_PLAN.md)` |
| **Jae**  | **Listings** (browse → create → detail), **public comments** on listings, **private Messages**, **pay**, **deals/reviews**, DB, MiniKit | This is the **marketplace engine** and **money path**—needs real routes, auth, and World when integrated. Reputation **data** here **feeds** Nico’s profile designs. | `[JAE_WORK_PLAN.md](./JAE_WORK_PLAN.md)`   |


**Page purposes in one glance**

- **Landing** ≠ **Home:** landing = *why join*; home = *what’s next inside*.  
- **My profile** ≠ **other profile:** self vs person you’re judging before a deal.  
- **Listing comments** ≠ **Messages:** public Q&A vs private DM.

This file stays the **full prompt archive** (all tiers). **Nico** and **Jae** use their two docs above for **day-to-day** tasks and URLs.

This doc **chunks** `[design_doc.md](./design_doc.md)` so **two people** can work in parallel:


| Role            | Who                             | How they work                                                                                                                                                                |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UX designer** | Your partner (no code expected) | **Designs by writing prompts** (e.g. in Cursor/ChatGPT): screen flows, copy, layout intent, states, and accessibility. They **do not** need to read TypeScript or touch Git. |
| **SWE**         | You                             | Implements: database, APIs, World MiniKit, auth, and wiring. You can **paste the UX prompt packs** into your AI assistant to generate UI faster, then integrate.             |


**Product decisions (locked):**


| Topic                     | Decision                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Payments**              | **Direct pay** to seller in World App. **Escrow** = **stretch** only (mention in copy/future section). |
| **World ID**              | **Required to list and to buy** (block flows until verified).                                          |
| **Fees**                  | **Near-zero** for users = **small network gas only**; no app fee in the MVP story.                     |
| **“Unified” IG/FB**       | **Demo only:** UI looks “connected”; **no real linking** behind the scenes.                            |
| **Comments vs messaging** | **Listing comments = public.** **Messaging = private** 1:1.                                            |


---

## How you work together (simple)

1. **UX goes first per tier (lightweight):** For each tier below, the UX person fills a **Prompt pack** (copy the template, answer the bullets). They paste it in chat to **you** or to **your** AI while you implement.
2. **SWE implements** using `[HACKATHON_SPEC.md](./HACKATHON_SPEC.md)` and this doc’s **SWE checklist**—no need for your partner to understand the stack.
3. **Sync 15–20 min** when a tier starts: UX explains the flow in plain language; SWE says “possible / cut for time” once.
4. **Handoff artifact:** One message or doc section per tier titled **“Tier X — UX prompt pack”** so nothing is lost.

---

## Design system — **shadcn/ui** (everyone)

- **Product UI** (layouts, forms, modals, lists, profile chrome, listings, messages) is implemented with **[shadcn/ui](https://ui.shadcn.com/)** on Tailwind — see `[HACKATHON_SPEC.md](./HACKATHON_SPEC.md)`.
- **LLM prompts:** Instruct the model to use **shadcn components only** (Button, Card, Dialog, Sheet, Input, Badge, …). **Do not** ask for Material UI, Bootstrap, Chakra, or unrelated CSS kits unless the team explicitly agrees.
- **If something looks off:** Ask **“Is this using shadcn/ui?”** and regenerate or have Jae refactor to `**src/components/ui/*`**.
- **Exception:** `**@worldcoin/mini-apps-ui-kit-react`** (and MiniKit-driven flows) for wallet-native patterns where the docs recommend it — still keep **surrounding** screens shadcn-consistent where possible.

---

## Shared product rules (everyone — plain English)

- **Trust:** Buying and selling listings requires **World ID verification** first.
- **Money:** Paying is **direct to seller**; we **do not** hold money in the middle for MVP (**escrow** is a future idea).
- **Costs:** We tell users they pay **only tiny network fees (gas)**, not a big app cut.
- **Social proof on profile:** **Looks** linked (Instagram/Facebook); **no real login** for hackathon.
- **Public vs private:** **Questions on a listing** = everyone can read. **Chat between two people** = private.

**SWE-only reminders** (partner can ignore):

- Server must enforce verification + pay rules; don’t rely on UI alone.
- Use `getDb()` only on the server; follow `HACKATHON_SPEC.md` for stack.
- Implement UI with **shadcn**; add primitives with `npx shadcn@latest add <component>`.

---

## Tier 1 — App shell & navigation — **MVP**

### UX designer — Prompt pack (copy and fill in)

Paste into your AI assistant (or send to SWE). Replace bracketed parts.

```text
You are helping design a mobile-first mini app for luxury watch resale with reputation.

Implementation: describe UI using **shadcn/ui** components only (no Material UI, Bootstrap, etc.). Name primitives (Button, Card, Dialog, Tabs, …) where relevant.

Context: [1–2 sentences from design_doc.md problem space]

Design the following for Tier 1 — Foundations:

1) LANDING (first-time visitor)
   - What headline and subtext explain the app in one screen?
   - Primary button(s): e.g. “Sign in with World” / “Browse listings”
   - Short “how it works” in 3 steps if space allows

2) MAIN SHELL (after sign-in)
   - Bottom tabs OR top nav: label each destination (Home, Listings, Messages, Profile)
   - Icon + label suggestions for each tab
   - What appears on Home vs empty state?

3) EMPTY STATES
   - No listings yet: illustration or icon, message, CTA
   - No messages yet: message, CTA
   - Friendly, premium tone (luxury resale, not gaming)

4) VISUAL DIRECTION
   - Light/dark preference, spacing (airy vs dense), one reference app (“like ___ but calmer”)

5) ACCESSIBILITY
   - Touch targets, contrast note, error message style (short, human)

Output: bullet list of screens + for each screen list sections and exact suggested copy.
```

### SWE — Checklist

- Routes match **URL map** (end of doc); landing vs protected home.
- Navigation wired to real routes; stubs OK for Messages early.
- Empty states exist where UX specifies.

---

## Tier 2 — Listings & public comments — **MVP**

### UX designer — Prompt pack

```text
Design Tier 2 — Listings and PUBLIC comments (everyone can read; not private DM).

1) BROWSE LISTINGS
   - Card layout: what shows per watch (title, one-line detail, seller hint, price if any?)
   - Loading and error states (short copy)

2) LISTING DETAIL
   - Hero area, title, full details, seller block (tap to profile)
   - Primary actions: [Pay] later in Tier 5 — for now placeholder or “Verify to buy”
   - Clear label: “Public questions” for the comment thread

3) CREATE LISTING (only after World ID verified — user may see a blocker screen first)
   - Form fields: title, details (textarea), optional fields you want (condition, model #)
   - Success: where user lands + confirmation copy
   - If NOT verified: blocking screen copy + CTA to verify

4) PUBLIC COMMENTS (under listing)
   - Composer placeholder, submit button label
   - Thread: avatar/initial, username/wallet short, timestamp
   - Rules line: “Public — visible to everyone”

Output: screen-by-screen copy + component list in plain English.
```

### SWE — Checklist

- Schema + APIs for listings + `listing_comments`.
- Server: **cannot create listing** unless user verified (World ID).
- Browse/detail/create + comment thread per UX copy.

---

## Tier 3 — Profile & “connected” accounts (demo) — **MVP**

### UX designer — Prompt pack

```text
Design Tier 3 — Profile and trust signals.

1) MY PROFILE
   - Sections: photo/avatar area, display name, World ID verified badge (clear ON/OFF)
   - Wallet line: shorten middle “0x12…ab” with copy button? (say yes/no)
   - “Connected accounts” row: Instagram, Facebook as **visual chips** (looks linked; no real OAuth)
   - Reputation summary strip: % positive, # sales, tenure — use placeholder labels

2) OTHER USER PROFILE (seller/buyer)
   - Same layout minus edit; report/block optional (say if skip for MVP)
   - Trust copy: one line under badge

3) STATES
   - Not verified: banner or card explaining must verify to list/buy

Output: exact copy + layout order top to bottom.
```

### SWE — Checklist

- Profile routes; persist verification flag for gates.
- “Connected” accounts = static/demo data per UX (no OAuth).

---

## Tier 4 — Reputation & reviews — **MVP**

### UX designer — Prompt pack

```text
Design Tier 4 — After a deal, reviews and scores.

1) LEAVE REVIEW (after purchase succeeds)
   - Star or thumbs, short text optional, submit
   - “One review per purchase” explained in one sentence

2) PROFILE / REPUTATION DISPLAY
   - How % positive and # sales are shown (badges, progress, plain numbers)
   - Tenure: “Member since” or “Active for X months”

3) SELLER VIEWING A BUYER
   - Buyer stats: purchases, optional “conversion” as “Responds often” stub
   - Empty state if no history

Output: copy + flow diagram in words (step 1 → 2 → 3).
```

### SWE — Checklist

- Deals + reviews schema; uniqueness rule; aggregates for profile.

---

## Tier 5 — Pay (direct) & fee story — **MVP**

### UX designer — Prompt pack

```text
Design Tier 5 — Pay seller directly in app (World App payment).

1) PAY FLOW
   - Pre-pay summary: listing title, amount, seller name, fee note: “You pay a small network fee only; no app fee.”
   - Confirm button copy
   - Success: confetti optional — message + “Leave a review” CTA
   - Failure: short errors (declined, try again)

2) BLOCKERS
   - Not World ID verified: same pattern as Tier 2/3

3) STRETCH (copy only — no build required)
   - One paragraph describing future ESCROW in plain English for judges/readme

Output: every string the user reads during pay + success/fail.
```

### SWE — Checklist

- `MiniKit.pay` wired; **block** if buyer not verified.
- Deal row updated idempotently from payment reference.
- Escrow stays **out of code**; optional README blurb from UX stretch text.

---

## Tier 6 — Private messaging — **MVP**

### UX designer — Prompt pack

```text
Design Tier 6 — PRIVATE messaging (not the same as public listing comments).

1) INBOX
   - Thread list: other person name, last message preview, time
   - Empty state

2) THREAD
   - Bubbles, input bar, send button, “online” optional (skip if hard)
   - Difference from listing comments: subtitle “Private between you and [name]”

3) ENTRY FROM LISTING
   - Button on listing: “Message seller” → opens or creates thread
   - Clarify: this is NOT posting to public comments

Output: copy + when to show which screen.
```

### SWE — Checklist

- Threads + messages schema; private by design.
- “Message seller” entry point from listing.

---

## URL map (SWE implements; UX uses for prompts)


| Path                    | Purpose                        |
| ----------------------- | ------------------------------ |
| `/`                     | Landing                        |
| `/home`                 | Signed-in home                 |
| `/listings`             | Browse                         |
| `/listings/new`         | Create listing (verified only) |
| `/listings/[id]`        | Detail + **public** comments   |
| `/messages`             | **Private** inbox              |
| `/messages/[threadId]`  | Thread                         |
| `/profile` or `/me`     | Me                             |
| `/u/[walletOrUsername]` | Other user                     |


---

## Phasing (who does what when)


| Phase       | Nico                                                                | Jae                                       |
| ----------- | ------------------------------------------------------------------- | ----------------------------------------- |
| **Kickoff** | Landing + Home prompts (`[NICO_WORK_PLAN.md](./NICO_WORK_PLAN.md)`) | Listings/message stubs + schema direction |
| **Early**   | Profile prompts + springboard screens                               | Listings CRUD + public comments           |
| **Mid**     | Reputation-on-profile copy (Tier 4 display)                         | Deals, reviews, MiniKit pay               |
| **Late**    | —                                                                   | Messaging + “Message seller”              |


---

## Backlog / stretch

- **Escrow** (hold funds until confirm) — UX may keep one paragraph; SWE does not build for MVP.
- **Off-platform** deals counting toward reputation.
- **Real** Instagram/Facebook OAuth (replace demo chips).

