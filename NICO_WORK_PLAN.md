# Nico — work plan (Home, Profile, Landing)

## Who is doing what

| Person | Role | What they own in this project |
|--------|------|--------------------------------|
| **Nico** | UX (prompts; no code required) | **First impression & identity:** how we explain the app (**Landing**), what users see when they’re “in” the app (**Home**), and how **people** look—**your own profile** vs **someone else’s profile**. All of that is designed on **`/design/*`** in a normal browser (no World App). |
| **Jae** | Engineer | **Marketplace motion:** **Listings** (browse, post, detail, **public** Q&A), **private Messages**, **pay**, deals/reviews, database, World/MiniKit. He implements your prompts in code and later **merges** your `/design` UI into the real mini-app routes. |

**Related doc:** [Jae’s work plan](./JAE_WORK_PLAN.md) — listings, messages, pay, backend.

**Flow between you:** Nico ships copy + layout intent (prompts) → Jae builds with **shadcn** under `src/app/design/*` → when ready, Jae **ports** the same patterns to production (`/`, `/home`, `/profile`, `/u/...`) and wires wallet + World ID.

---

## UI library & LLM prompts — **shadcn only**

Product UI in this repo is built with **[shadcn/ui](https://ui.shadcn.com/)** (on Tailwind). When you prompt ChatGPT, Cursor, etc.:

- **Ask explicitly** for **shadcn/ui** components only (Button, Card, Dialog, Sheet, Input, Badge, Avatar, etc.). **Do not** ask for Material UI, Bootstrap, Chakra, random CSS frameworks, or “custom HTML only” unless Jae agrees for an exception.
- **World Mini App shell:** Jae may still use **`@worldcoin/mini-apps-ui-kit-react`** for a few wallet-native flows (pay, verify). Your **landing / home / profile** prompts should stay **shadcn** so everything matches.
- **If the output looks off** (weird spacing, alien buttons, wrong patterns): **stop and ask** — *“Is this using shadcn/ui components? Regenerate using shadcn only.”*

Jae should implement your specs with **`src/components/ui/*`** (shadcn) unless it’s an intentional World kit surface.

---

## Important: where you work (browser only)

All of **your** screens live under **`/design/...`**. Those routes are **public**: normal **Chrome/Safari/Firefox on `http://localhost:3000`** — **no World App**, **no ngrok**, **no tunnel**, **no sign-in**.

The gray bar at the top links between these pages. It also has **Jae sandbox** → [`/design/jae`](http://localhost:3000/design/jae) (his listings/messages stubs — separate sky-colored bar).

**Do not rely on** `/home`, `/profile`, or `/` for your day-to-day work — those are tied to the real mini-app shell (sign-in, World, etc.). Jae will **copy your layout/copy** from `/design` into those routes when integrating.

---

## Purpose of each page (what it’s for)

**Landing vs Home (easy mix-up):**

- **Landing** answers: *What is this product? Why should I care? How do I get in?* It’s the **story and entry**—often the first thing a **new** visitor sees (value prop, trust hook, primary CTAs like “Get started” / “Sign in”). In the design sandbox: **`/design`**.
- **Home** answers: *I’m already “inside”—what’s next?* It’s a **hub**: shortcuts (e.g. browse listings, messages), gentle prompts (e.g. “Verify to list”), maybe a calm empty state—not usually a repeat of the full marketing pitch. In the design sandbox: **`/design/home`** (pretend the user is signed in, e.g. fake “Alex”).

**Two different “profiles” (same layout idea, different job):**

| Page | URL (design) | **Whose** identity? | **User job-to-be-done** |
|------|----------------|---------------------|-------------------------|
| **My profile** | `/design/profile` | **Me** — the logged-in person | See **my** verification, wallet, demo “connected” socials, **my** reputation; future: edit/manage **my** presentation. |
| **Someone else’s profile** | `/design/u/demo-seller` (any slug) | **Another member** (e.g. seller on a watch) | **Decide if I trust them** before a deal: **their** World ID state, **their** reputation, read-only; optional Report/Block. |

Think **Instagram: your profile tab** vs **opening someone else’s profile** from a post.

**Quick open list**

| Screen | URL |
|--------|-----|
| Landing | `http://localhost:3000/design` |
| Home | `http://localhost:3000/design/home` |
| My profile | `http://localhost:3000/design/profile` |
| Other user’s profile | `http://localhost:3000/design/u/demo-seller` (swap slug while designing) |

---

## Toolkit — things you can use (no database required)

Use these so screens feel **real** before Supabase or World data exists. You don’t have to write code—**ask Jae** (or put it in your prompt) to drop in **hardcoded / mock** values on `/design/*` pages.

### Fake people (names, wallets, verification)

- **Display name** — e.g. `Alex Kim`, `Jordan Lee`, `Sam Rivera` (rotate for “other user” vs “me”).
- **Wallet address** — fake but realistic shape: `0x71C…9A3e` (truncate middle in UI; full string only if copy button).
- **Verified vs not** — ask for **two variants** of the same screen (badge on/off, different banner copy).
- **Member since / tenure** — e.g. `Member since March 2025`, `Active 4 months`.

### Fake profile photos

- **Avatar URLs** (safe for demos): e.g. [Pravatar](https://pravatar.cc/) — `https://i.pravatar.cc/150?u=watch-seller-1` (change the `u=` string for different faces).
- **Unsplash** — pick one stable image URL for a “luxury watch” hero if needed (ask the LLM for a single licensed-street URL or use [picsum.photos](https://picsum.photos/) with fixed seed: `https://picsum.photos/seed/watch1/400/300`).

### Fake listings (for Home previews or future shared mocks)

Ask Jae to hardcode a small array like **2–3 cards**: title (`Rolex Submariner 2021`), short teaser, optional price (`$12,500` or `Price on request`), seller display name, thumbnail URL (picsum/unsplash). Same idea as a **JSON snippet** in your prompt so the AI knows what to render.

### Fake social “connections” (demo only)

- **Chips only:** `@alexkim.watches` (Instagram), `Alex Kim Watches` (Facebook)—no real OAuth; just text + icon in the prompt.

### Fake reputation numbers

- **% positive** — e.g. `98%` / `No reviews yet`.
- **Sales / purchases** — e.g. `12 sales`, `3 purchases`.
- **Streak or tenure** — whatever fits your story; label clearly as placeholder in prompts.

### UI states to ask for explicitly

- **Empty** — no listings, no messages, no reviews yet (calm copy + one CTA).
- **Loading** — skeleton rows/cards (shadcn `Skeleton`).
- **Error** — one short line + retry (e.g. “Couldn’t load profile”).
- **Success** — toast or inline check after an action (even if the button is fake in `/design`).

### Browser tricks (free)

- **Mobile width** — narrow the window or **DevTools → device toolbar** (iPhone size) so mini-app layout makes sense.
- **Zoom** — 100% vs 125% to check readability.

### When talking to Jae or Cursor

Paste a **mini content spec** in your message, e.g.:

```text
Mock data for /design/home:
- user.displayName = "Alex Kim"
- user.verified = true
- user.avatarUrl = "https://i.pravatar.cc/150?u=alex-home"
- listingsPreview = [ { title: "...", price: "...", image: "https://picsum.photos/seed/w1/200/200" }, ... ]
```

### Optional extras

- **Screenshot + arrow** — mark up a reference in Preview/Figma; paste into chat (“put the badge here”).
- **Loom** — 30s screen recording for Jae if layout is easier to show than type.
- **Comp references** — “density like Depop, tone like Mr Porter” (still implement with **shadcn**).

---

## Your machine: first-time setup (do this once)

### 1) Install tools (if you don’t have them)

- **Git** — [https://git-scm.com/downloads](https://git-scm.com/downloads)  
- **Node.js** — **LTS** (e.g. 20.x or 22.x): [https://nodejs.org](https://nodejs.org)  
  - Check: open Terminal (Mac) or PowerShell / Command Prompt (Windows) and run:
    - `node -v` → should print a version like `v20.x` or `v22.x`
    - `npm -v` → should print a version number

- **Editor (optional)** — VS Code or Cursor if you want to peek at files; **not required** for UX prompts.

### 2) Get the code on your computer

Ask Jae for the **GitHub (or Git) URL** of the repo. Then:

**Mac / Linux (Terminal):**

```bash
cd ~/Documents   # or wherever you keep projects
git clone <PASTE-REPO-URL-HERE> my-first-mini-app
cd my-first-mini-app
```

**Windows (PowerShell):**

```powershell
cd $HOME\Documents
git clone <PASTE-REPO-URL-HERE> my-first-mini-app
cd my-first-mini-app
```

### 3) Use your **own branch** (so you don’t overwrite Jae)

```bash
git checkout main
git pull
git checkout -b nico/design-ui
```

Use branch name **`nico/design-ui`** (or whatever Jae agrees on). **Only you** commit on this branch for layout/copy experiments if Jae sets that up; otherwise you only run locally and send prompts to Jae.

### 4) Install dependencies (once per clone)

```bash
npm install
```

If this fails, send Jae a screenshot of the **full error text**.

### 5) Run the app (every time you work)

```bash
npm run dev
```

Wait until the terminal says something like **“Ready”** and shows **port 3000**.

Open in your browser:

- **http://localhost:3000/design**

If **port 3000 is busy**, Jae may tell you to run:

```bash
npm run dev -- -p 3001
```

Then open **http://localhost:3001/design** instead.

### 6) Stop the server

In the terminal where `npm run dev` is running, press **Ctrl+C**.

---

## Daily workflow (short)

1. `cd` into the project folder.  
2. `git pull` (or ask Jae when to pull).  
3. `git checkout nico/design-ui` (your branch).  
4. `npm run dev`  
5. Open **http://localhost:3000/design** and use the top links.  
6. Write prompts (below) and send them to Jae or Cursor.

---

## If something breaks (before calling Jae)

| Problem | Try this |
|---------|----------|
| `command not found: npm` | Node isn’t installed or terminal was opened before install — restart terminal or reinstall Node LTS. |
| `EACCES` / permission errors on `npm install` | Don’t use `sudo`; ask Jae — may need to fix folder permissions or use `nvm`. |
| Page won’t load | Confirm terminal still shows `dev` running; try another browser; try `http://127.0.0.1:3000/design`. |
| Blank / error screen | Screenshot **browser** + **terminal** for Jae. |

---

## Springboard — what you see today

Under **`/design`**, pages start as **short placeholders**. Your job is to replace them with real structure, copy, and states via **prompt packs** (and Jae or AI implements in code).

| Screen | URL | Purpose (reminder) | Your design focus |
|--------|-----|--------------------|-------------------|
| **Landing** | `/design` | Sell the idea + get people in | Headline, subtext, CTAs, optional “how it works” |
| **Home** | `/design/home` | Orient signed-in users; what’s next | Shortcuts, trust cues, verify nudges, empty states (fake user OK) |
| **My profile** | `/design/profile` | **My** identity & reputation | Avatar, World ID badge, wallet, demo social chips, stats strip |
| **Other profile** | `/design/u/...` | **Their** trust surface | Read-only layout, trust line, optional Report/Block |

**Jae’s pages** (**Listings**, **Messages**, pay on listing) are separate; align with him on **tone**, **fee wording**, and **tab labels** when the full shell ships.

---

## Locked product rules (read once)

- **World ID** will be required to **list** and **buy** in the real app — your mocks can show **verified / not verified** as two states.  
- **Instagram/Facebook “connected”** is **demo only** (no real login).  
- **Fees:** story is **small network gas**, not a big app fee.  
- **Public questions** = on **listing** pages (Jae). **Private chat** = **Messages** (Jae).

---

## UX — Prompt pack A: Landing + Home (use `/design` routes)

**Note for Nico (read this):** These prompt packs are **not a complete checklist**. They’re a starting spine. You still need to **think like a product designer**: what opens as a **modal** vs a full page, how **forms** look (labels, validation errors, disabled states), how a **World ID verified badge** reads at a glance (shape, color, icon, label), what **skeleton / loading** states feel like, **tooltips**, **bottom sheets** on mobile, **success toasts**, etc. If it’s something a user sees or taps, call it out in your prompt output—even if the bullets below don’t mention it.

**shadcn:** Every UI prompt should require **shadcn/ui** building blocks only (see **UI library & LLM prompts** above). If a mockup or AI output looks non-shadcn, **ask to redo with shadcn** before sending to Jae.

When you paste the block below into an AI, **add** your own bullets at the end for anything extra you want (e.g. “design a modal for …”).

```text
Mobile-first mini app: luxury watch resale + reputation (see design_doc).

Routes: landing = /design, home = /design/home (browser only, fake user OK).

IMPORTANT: This brief is NOT exhaustive. Explicitly design (or describe) modals, sheets, form field patterns, badge/chip styles, loading and empty states, and any microcopy for errors—not only the bullets below.

STACK: Use **shadcn/ui** components only (Dialog, Sheet, Card, Button, Input, Badge, Avatar, Skeleton, etc.). Do not specify Material UI, Bootstrap, or other libraries. If unsure, name the shadcn primitive for each pattern.

1) LANDING (/design)
   Core:
   - Headline + subtext (one screen)
   - Primary / secondary buttons (e.g. “Get started”, “Browse” — may be non-functional in preview)
   - Optional: 3-step “how it works”

   Also think about (UI):
   - Any **modal or bottom sheet** (e.g. legal, “how trust works”, video)—when it opens, title, close affordance
   - **Button hierarchy** (primary vs ghost vs outline); what happens on hover/focus (describe for dev)
   - **Imagery or illustration** style if any (watch photography vs abstract; aspect ratio)
   - First visit vs return visit: same screen or a lighter variant?

2) HOME (/design/home)
   Core:
   - What belongs on Home vs Profile vs Listings?
   - First-time vs returning user (fake “Alex” OK)
   - Empty / calm default when there’s no activity yet

   Also think about (UI):
   - **Cards vs list rows** for shortcuts (e.g. “Continue browsing”, “Complete verification”)
   - **World ID / verified** teaser on Home if unverified: banner, inline alert, or **modal** CTA—copy + visual weight
   - **Trust cues**: how you show “human-verified marketplace” without clutter
   - **Quick actions** that might open **sheets** (filters, sort—not full listing UX, just pattern)
   - Any **form-like** inline inputs on Home (search?)—field style, placeholder, clear button

3) VISUAL SYSTEM & A11Y (cross-cutting)
   Core:
   - Premium resale tone (not gaming); touch-friendly layout

   Also think about (UI):
   - **Verified badge** spec for later consistency with Profile: icon + text variants (“Verified”, “Not verified”), size on cards vs on profile
   - **Form controls** pattern: input height, radius, label above vs floating, error text placement
   - **Modal pattern**: dimmed backdrop, max width on mobile, swipe-to-dismiss yes/no
   - **Typography scale** (page title vs section vs caption); **spacing** rhythm
   - **Focus states** and **contrast** for text vs background; short, human **error** strings

Output: section-by-section copy, layout order, AND a separate list titled “Modals / sheets / extras” for anything not a full page. Include rough ASCII or structured description of badge and primary button styles if you can.
```

## Jae — SWE checklist (Nico surfaces)

- [ ] Implement Nico’s UX in **`src/app/design/*`** first (browser-only), using **shadcn** (`src/components/ui/*`). Add shadcn components with `npx shadcn@latest add …` as needed.  
- [ ] When ready for World: **port** the same layout/copy to **`src/app/page.tsx`**, **`(protected)/home`**, **`(protected)/profile`**, **`/u/...`** and wire auth, MiniKit, World ID.

---

## UX — Prompt pack B: Profile & trust UI (`/design/profile`, `/design/u/...`)

**Two screens, two meanings:** **My profile** = the viewer’s **own** account (manage/see **self**). **Other user** = **someone else** you’re evaluating (e.g. seller)—**read-only** trust view. See **Purpose of each page** above.

**shadcn:** Same as Pack A — **shadcn/ui only** in prompts; if anything looks off, ask whether it’s shadcn before accepting.

```text
Profile screens (design preview).

STACK: **shadcn/ui** only (Badge, Avatar, Card, Button, Dialog, Separator, etc.). No other component libraries.

1) MY PROFILE (/design/profile) — “this is ME”
   - Avatar, display name, World ID badge ON/OFF
   - Wallet truncated + copy button? (yes/no)
   - Instagram/Facebook chips (visual only)
   - Reputation strip placeholders

2) OTHER USER (/design/u/demo-seller) — “this is SOMEONE ELSE I might buy from”
   - Read-only; optional Report/Block?
   - One trust line under badge

3) NOT VERIFIED
   - Banner: must verify to list/buy — CTA copy

Output: top-to-bottom layout + exact strings.
```

## Jae — Profile depth (after integration)

- [ ] Persist verification + wire real data to **production** profile routes (not required for Nico’s `/design` mocks).

---

## UX — Prompt pack C: Reputation on profile (later)

When real deals exist, refine how numbers look on **production** profile — see [`TEAM_WORK_PLAN.md`](./TEAM_WORK_PLAN.md) Tier 4 profile bits. Keep prompts **shadcn/ui**-based (e.g. Badge, Card stats rows).

---

## Pay copy (coordinate with Jae)

Optional **Prompt pack D:** one paragraph + one sentence for **“fees = gas only”** that Jae can paste on pay screens. (Pay **UI** may use World kit where required; **surrounding** layout/copy should still align with shadcn elsewhere—coordinate with Jae.)

---

## Quick URL map (your design workspace)

| Path | Role |
|------|------|
| `/design` | Landing — product story + entry |
| `/design/home` | Home — hub after “I’m in” |
| `/design/profile` | My profile — **self** |
| `/design/u/[handle]` | Other user’s profile — **trust check** |

**Production** (after Jae merges): `/`, `/home`, `/profile`, `/u/...` — you don’t need to run those for UX iteration.
