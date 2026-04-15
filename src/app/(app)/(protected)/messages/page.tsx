import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function MessagesPage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Messages" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <p className="text-sm text-neutral-600">
          <strong>UX springboard:</strong> private inbox (empty state). Not the same as public
          listing comments.
        </p>
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          No conversations yet — placeholder
        </p>
      </Page.Main>
    </>
  );
}
