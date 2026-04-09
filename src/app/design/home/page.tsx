import { Page } from '@/components/PageLayout';

/** Nico: signed-in hub mock — use fake username / stats as needed. */
export default function DesignHomePage() {
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Design route — /design/home</p>
          <h1 className="text-xl font-semibold text-foreground">Home (placeholder)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Nico: dashboard, shortcuts to listings/messages, trust cues, empty states. Pretend user
          is &quot;Alex&quot; with fake data if helpful.
        </p>
      </Page.Main>
    </Page>
  );
}
