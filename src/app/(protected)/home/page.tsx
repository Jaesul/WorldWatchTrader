import { auth } from '@/auth';
import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { Pay } from '@/components/Pay';
import { Transaction } from '@/components/Transaction';
import { UserInfo } from '@/components/UserInfo';
import { Verify } from '@/components/Verify';
import { ViewPermissions } from '@/components/ViewPermissions';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Home"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <p className="w-full text-center text-sm text-neutral-600">
          <SpringboardLink href="/listings">Open listings (UX springboard)</SpringboardLink>
        </p>
        <UserInfo />
        <Verify action="test-action" />
        <Pay />
        <Transaction />
        <ViewPermissions />
      </Page.Main>
    </>
  );
}
