import { Page } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';

export default function DesignHomePage() {
  const howItWorks = [
    {
      title: 'Discover trusted sellers',
      body: 'Browse premium watch listings from verified humans in one focused marketplace.',
    },
    {
      title: 'Check trust before you deal',
      body: 'See profile reputation, badge state, and seller context before you chat or buy.',
    },
    {
      title: 'Move to secure checkout',
      body: 'Complete payment flows with clear gas-only fee messaging in production surfaces.',
    },
  ];

  const quickActions = [
    {
      title: 'Browse listings',
      body: 'Explore recent watch drops and saved filters.',
      cta: 'Open marketplace',
    },
    {
      title: 'Messages',
      body: 'Pick up private deal chats and answer buyer questions.',
      cta: 'Open inbox',
    },
    {
      title: 'Profile and trust',
      body: 'Review your badge status, stats, and public seller view.',
      cta: 'View profile',
    },
  ];

  return (
    <Page className="min-h-0">
      <Page.Main className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Design route - /design/home
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, Alex</h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of activity, trust signals, and the next step in your buying or selling flow.
          </p>
        </section>

        <section className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">
            Verification recommended
          </p>
          <p className="mt-1 text-sm text-foreground/80">
            Verify your profile to unlock listing and buying in production routes.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm">Start verification</Button>
            <Button size="sm" variant="outline">
              Why this matters
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="home-search" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quick search
          </label>
          <input
            id="home-search"
            placeholder="Search watches, brands, or sellers"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <article key={action.title} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{action.body}</p>
                <Button className="mt-3" variant="outline" size="sm">
                  {action.cta}
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Calm empty state</h2>
          <p className="text-sm text-muted-foreground">
            No new activity yet. Start by browsing fresh listings or updating your profile trust
            surface.
          </p>
          <Button size="sm">Browse now</Button>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">How it works</h2>
          <div className="grid gap-3">
            {howItWorks.map((item, idx) => (
              <div key={item.title} className="rounded-lg border border-border/80 bg-background p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {idx + 1}
                </p>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-dashed border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Loading preview</h2>
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          </div>
        </section>
      </Page.Main>
    </Page>
  );
}
