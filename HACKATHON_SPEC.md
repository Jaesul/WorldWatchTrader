# Hackathon mini app — technical specification

## Tech stack

### Baseline (already in the project)

This repo uses the **World Next 15 mini app template**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, and the **World Mini App stack** (`@worldcoin/minikit-js`, `@worldcoin/minikit-react`, `@worldcoin/mini-apps-ui-kit-react`, `@worldcoin/idkit`, `viem`).

**Auth is already NextAuth (Auth.js v5)** with a **Credentials** provider that verifies **MiniKit wallet auth / SIWE** and enriches the user via `MiniKit.getUserInfo` — the same idea as the community example: [supercorp-ai/minikit-wallet-auth-next-auth](https://github.com/supercorp-ai/minikit-wallet-auth-next-auth). The route is wired at `src/app/api/auth/[...nextauth]/route.ts` and configuration lives in `src/auth/index.ts`.

We are **not** choosing NextAuth from scratch; we **standardize on this pattern** and extend it (for example, linking wallet users to database rows when Drizzle is added).

### Decisions (what we are committing to)

| Layer | Choice | Role |
|--------|--------|------|
| **App** | Next.js (App Router) | Mini app shell, API routes, SSR where needed |
| **UI backbone** | **shadcn/ui** (+ Tailwind) | App chrome, forms, tables, dialogs — default component layer |
| **World UI / flows** | `@worldcoin/mini-apps-ui-kit-react` + MiniKit | World-specific primitives and flows where docs / UI kit are the source of truth |
| **ORM** | **Drizzle** | Schema-as-code, typed queries, migrations |
| **Database** | **Supabase** | Managed Postgres (hosting, dashboard, optional auth/storage later); Drizzle targets the Postgres connection |
| **Auth** | **NextAuth** + wallet Credentials + JWT sessions | Same mental model as the community example; optional later: DB user records keyed by `walletAddress` |

### Integration notes

1. **shadcn + Tailwind 4** — This repo already uses Tailwind v4. When running `npx shadcn@latest init`, follow the CLI and docs for Tailwind v4 compatibility; shadcn components are the default — adjust `tailwind.config` / `@theme` as needed per shadcn + v4 guidance.
2. **Two UI layers on purpose** — shadcn for **product** UI; World kit / MiniKit for **wallet / mini app** behaviors aligned with the platform.
3. **Drizzle + NextAuth** — JWT sessions can stay minimal for the hackathon; Drizzle holds **application data** (and optionally a `users` table keyed by wallet). Database-backed sessions are optional unless required.
4. **Supabase + Drizzle** — Use the Supabase **database** connection string for Drizzle (migrations and queries). Row Level Security and the Supabase JS client are optional; this stack can treat Supabase as Postgres-only at first.

### Out of scope (later sections)

- Product one-liner, user stories, screens
- API surface and environment variables
- Judging / demo narrative

---

*Last updated: database set to Supabase.*
