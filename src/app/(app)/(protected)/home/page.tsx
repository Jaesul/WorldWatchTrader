import { auth } from '@/auth';
import { SpringboardLink } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { Pay } from '@/components/Pay';
import { Transaction } from '@/components/Transaction';
import { AutoVerifyDialog } from '@/components/Verify/AutoVerifyDialog';
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
      <Page.Main className="mb-16 flex flex-col items-center justify-start gap-4">
        <AutoVerifyDialog
          initiallyVerified={Boolean(session?.user.orbVerified)}
          action="test-action"
        />
        <p className="w-full max-w-lg text-center text-sm text-neutral-600">
          Marketplace listings, messages, and related flows live in the{' '}
          <SpringboardLink href="/design">design prototype</SpringboardLink> for now.
        </p>

        <UserInfo />
        {!session?.user.orbVerified ? <Verify action="test-action" /> : null}
        <Pay />
        <Transaction />
        <ViewPermissions />
      </Page.Main>
    </>
  );
}
