import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default function ProfilePage() {
  return (
    <>
      <Page.Header className="p-0">
        <TopBar title="Profile" />
      </Page.Header>
      <Page.Main className="flex flex-col gap-4 mb-16">
        <p className="text-sm text-neutral-600">
          <strong>UX springboard:</strong> World ID badge, wallet line, fake “connected”
          Instagram/Facebook chips, reputation strip (placeholders).
        </p>
      </Page.Main>
    </>
  );
}
