import { Page } from '@/components/PageLayout';

/** Nico: replace with real landing UX (copy, hero, CTAs). */
export default function DesignLandingPage() {
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Design route — /design
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Landing (placeholder)</h1>
          <p className="text-sm text-muted-foreground">
            Nico: headline, subtext, primary buttons, and optional “how it works” go here. No
            sign-in required to view this page.
          </p>
        </div>
      </Page.Main>
    </Page>
  );
}
