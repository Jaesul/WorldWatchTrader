'use client';
import { IDKit, IDKitErrorCodes, orbLegacy, type RpContext } from '@worldcoin/idkit';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * This component is an example of how to use World ID verification via IDKit.
 * Verification now goes through IDKit end-to-end (both native World App and web).
 * It's critical you verify the proof on the server side.
 * Read More: https://docs.world.org/mini-apps/commands/verify#verifying-the-proof
 */
export const Verify = ({
  action,
  showHeading = true,
  onVerified,
}: {
  action: string;
  showHeading?: boolean;
  onVerified?: () => void;
}) => {
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);
  const router = useRouter();
  const resetToIdle = () => setButtonState(undefined);
  const setFailedTemporarily = () => {
    setButtonState('failed');
    setTimeout(() => setButtonState(undefined), 2000);
  };

  const onClickVerify = async () => {
    setButtonState('pending');
    try {
      // Fetch RP signature from your backend
      const rpRes = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!rpRes.ok) {
        throw new Error('Failed to get RP signature');
      }

      const rpSig = await rpRes.json();
      const rpContext: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      // Use IDKit request API
      const request = await IDKit.request({
        app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
        action,
        rp_context: rpContext,
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: '' }));

      const completion = await request.pollUntilCompletion({
        pollInterval: 2_000,
        timeout: 120_000,
      });

      if (!completion.success) {
        if (
          completion.error === IDKitErrorCodes.Cancelled ||
          completion.error === IDKitErrorCodes.Timeout
        ) {
          resetToIdle();
          return;
        }
        setFailedTemporarily();
        return;
      }

      // Verify the proof on the server
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rp_id: rpSig.rp_id,
          idkitResponse: completion.result,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setButtonState('success');
        onVerified?.();
        router.refresh();
      } else {
        setFailedTemporarily();
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === IDKitErrorCodes.Cancelled ||
          error.code === IDKitErrorCodes.Timeout)
      ) {
        resetToIdle();
        return;
      }
      setFailedTemporarily();
    }
  };

  return (
    <div className="grid w-full gap-4">
      {showHeading ? <p className="text-lg font-semibold">Verify</p> : null}
      <LiveFeedback
        label={{
          failed: 'Failed to verify',
          pending: 'Verifying',
          success: 'Verified',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={onClickVerify}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full bg-[#ffc85c] text-foreground hover:bg-[#ffc85c]/90"
        >
          Verify with World ID
        </Button>
      </LiveFeedback>
    </div>
  );
};
