import { Page } from '@/components/PageLayout';

/** Nico: other user profile — `handle` is fake slug for demo copy. */
export default async function DesignPublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return (
    <Page className="min-h-0">
      <Page.Main className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Design route — /design/u/{handle}
          </p>
          <h1 className="text-xl font-semibold text-foreground">Seller profile (placeholder)</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Nico: read-only profile for another person; trust line under badge; reputation stats.
          Current demo handle: <code className="rounded bg-muted px-1">{handle}</code>
        </p>
      </Page.Main>
    </Page>
  );
}
