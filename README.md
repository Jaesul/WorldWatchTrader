# WorldWatchTrader

Repo for [World Hackathon](https://github.com/Jaesul/WorldWatchTrader). Mini app built from the World Next.js template.

## Create a Mini App

[Mini apps](https://docs.worldcoin.org/mini-apps) enable third-party developers to create native-like applications within World App.

This template is a way for you to quickly get started with authentication and examples of some of the trickier commands.

## Getting Started

1. cp .env.sample .env.local
2. Follow the instructions in the .env.local file
3. Run `npm run dev`
4. Run `ngrok http 3000`
5. Run `npx auth secret` to set `AUTH_SECRET` in `.env.local` (see [Auth.js env](https://cli.authjs.dev)).
6. Set `HMAC_SECRET_KEY` in `.env.local` (e.g. `openssl rand -base64 32`); wallet nonce signing uses it — see `.env.sample`.
7. Add your domain to the `allowedDevOrigins` in the next.config.ts file.
8. [For Testing] If you're using a proxy like ngrok, you need to update the `AUTH_URL` in the .env.local file to your ngrok url.
9. Continue to developer.worldcoin.org and make sure your app is connected to the right ngrok url
10. [Optional] For Verify and Send Transaction to work you need to do some more setup in the dev portal. The steps are outlined in the respective component files.

**UX sandbox (browser only, no World):** Nico — [http://localhost:3000/design](http://localhost:3000/design) ([`NICO_WORK_PLAN.md`](./NICO_WORK_PLAN.md)). Jae — [http://localhost:3000/design/jae](http://localhost:3000/design/jae) ([`JAE_WORK_PLAN.md`](./JAE_WORK_PLAN.md)).

## Authentication

This starter kit uses [Minikit's](https://github.com/worldcoin/minikit-js) wallet auth to authenticate users, and [next-auth](https://authjs.dev/getting-started) to manage sessions.

## UI Library

This starter kit uses [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) to style the app. We recommend using the UI kit to make sure you are compliant with [World App's design system](https://docs.world.org/mini-apps/design/app-guidelines). Product UI also uses [shadcn/ui](https://ui.shadcn.com/) — see [`HACKATHON_SPEC.md`](./HACKATHON_SPEC.md).

## Eruda

[Eruda](https://github.com/liriliri/eruda) is a tool that allows you to inspect the console while building as a mini app. You should disable this in production.

## Contributing

This template was made with help from the amazing [supercorp-ai](https://github.com/supercorp-ai) team.
