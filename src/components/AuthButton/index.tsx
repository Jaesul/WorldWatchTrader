'use client';
import { walletAuth } from '@/auth/wallet';
import { Button } from '@/components/ui/button';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  console.log('AuthButton render');
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();
  const hasAttemptedAuth = useRef(false);

  console.log('AuthButton state:', { isPending, isInstalled });

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
    } finally {
      setIsPending(false);
    }
  }, [isInstalled, isPending]);

  // Auto-authenticate on load when MiniKit is ready
  useEffect(() => {
    console.log('AuthButton effect:', {
      isInstalled,
      hasAttemptedAuth: hasAttemptedAuth.current,
    });
    if (isInstalled === true && !hasAttemptedAuth.current) {
      console.log('Firing walletAuth automatically');
      hasAttemptedAuth.current = true;
      setIsPending(true);
      walletAuth()
        .catch((error) => {
          console.error('Auto wallet authentication error', error);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [isInstalled]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" onClick={onClick} disabled={isPending || !isInstalled} size="lg" className="min-w-[200px]">
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Logging in…
          </>
        ) : (
          'Login with Wallet'
        )}
      </Button>
      {!isInstalled ? (
        <p className="text-center text-xs text-muted-foreground">Open in World App to sign in.</p>
      ) : null}
    </div>
  );
};
