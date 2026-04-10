import { Page } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';

export default function DesignLandingPage() {
  const generalListings = [
    {
      title: 'Rolex Submariner 2021',
      price: '$12,500',
      condition: 'Excellent',
      reputable: true,
    },
    {
      title: 'Omega Speedmaster Moonwatch',
      price: '$7,950',
      reputable: false,
    },
    {
      title: 'Audemars Piguet Royal Oak',
      price: 'Price on request',
      reputable: true,
    },
    {
      title: 'Cartier Santos Large',
      price: '$6,400',
      condition: 'Excellent',
      reputable: false,
    },
    {
      title: 'Patek Philippe Nautilus',
      price: '$89,000',
      condition: 'Very good',
      reputable: true,
    },
    {
      title: 'Tudor Black Bay 58',
      price: '$3,200',
      reputable: false,
    },
  ];

  return (
    <Page className="min-h-0">
      <Page.Main className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Shopping Time?</h1>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Browse general listings</h2>
          <p className="text-sm text-muted-foreground">
            Explore all categories and compare condition and pricing quickly.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {generalListings.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-xl border border-border/80 bg-background"
              >
                <div className="border-b border-border/70 bg-muted/40 p-3">
                  <div className="h-16 w-full rounded-md border border-dashed border-border bg-background/80 p-2">
                    <div className="flex h-full items-center gap-2">
                      <div className="size-8 rounded border border-border bg-muted/60" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-3/4 rounded bg-muted" />
                        <div className="h-2 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <div>
                    <p className="line-clamp-2 text-xs font-semibold text-foreground">{item.title}</p>
                    {item.price ? <p className="mt-1 text-xs text-muted-foreground">{item.price}</p> : null}
                    {item.condition ? (
                      <p className="text-xs text-muted-foreground">Condition: {item.condition}</p>
                    ) : null}
                  </div>
                  {item.reputable ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.47a.75.75 0 10-1.06-1.06L9.25 10.94 7.28 8.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l3.99-3.99z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reputable seller
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <Button variant="outline" size="sm">
            Open all listings
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Suggested items</h2>
          <div className="grid gap-2">
            <div className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-sm font-medium text-foreground">Rolex Submariner 2021</p>
              <p className="text-sm text-muted-foreground">$12,500 - Verified seller</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-sm font-medium text-foreground">Omega Speedmaster Moonwatch</p>
              <p className="text-sm text-muted-foreground">Price on request - Trusted history</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-sm font-medium text-foreground">Audemars Piguet Royal Oak</p>
              <p className="text-sm text-muted-foreground">Collector-grade condition</p>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Reputable sellers</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-sm font-medium text-foreground">Alex Kim Watches</p>
              <p className="text-sm text-muted-foreground">98% positive - 12 completed sales</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-sm font-medium text-foreground">Harbor Time Co.</p>
              <p className="text-sm text-muted-foreground">Verified profile - Fast response time</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Modals / sheets / extras</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Planned extras for this route: trust explainer sheet, legal details modal, and a short
            watch-market intro video dialog.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Copy intentionally concise for mobile; interaction polish comes in the next pass.
          </p>
        </section>
      </Page.Main>
    </Page>
  );
}
