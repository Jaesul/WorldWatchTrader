import { Page } from '@/components/PageLayout';

export default function DesignJaeMessagesPage() {
  return (
    <Page className="min-h-0">
      <Page.Header className="p-0 px-4 pt-4" data-design-chrome>
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1">/design/jae/messages</code> — private inbox (not
          listing comments). Thread list + empty state (shadcn).
        </p>
        <p className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
          No threads yet — placeholder
        </p>
      </Page.Main>
    </Page>
  );
}
