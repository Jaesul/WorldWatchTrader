import { Page } from '@/components/PageLayout';

/** Jae: signed-in style hub (fake user); shortcuts toward listings/messages. */
export default function DesignJaeHomePage() {
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Design route — /design/jae/home</p>
          <h1 className="text-xl font-semibold text-foreground">Home (Jae placeholder)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Mirror of Nico’s <code className="rounded bg-muted px-1">/design/home</code> idea — your
          version can emphasize seller/buyer shortcuts, listing drafts, or inbox peek. Use mock data.
        </p>
      </Page.Main>
    </Page>
  );
}
