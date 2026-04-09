import { Page } from '@/components/PageLayout';

/** Nico: my profile mock — fake wallet, World ID badge states, social chips. */
export default function DesignProfilePage() {
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Design route — /design/profile
          </p>
          <h1 className="text-xl font-semibold text-foreground">My profile (placeholder)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Nico: avatar, name, World ID verified badge, truncated wallet, fake Instagram/Facebook
          chips, reputation strip (placeholders).
        </p>
      </Page.Main>
    </Page>
  );
}
