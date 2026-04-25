'use client';

import { useEffect, useMemo, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { DmReviewRequestSnapshotPayload } from '@/hooks/useDmThreadStream';
import { useDrawerResident } from '@/hooks/use-drawer-resident';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DmReviewRequestSnapshotPayload | null;
  viewerId: string | null;
  onSubmitted?: (request: DmReviewRequestSnapshotPayload) => void;
};

export function SubmitReviewSheet({ open, onOpenChange, request, viewerId, onSubmitted }: Props) {
  const residentRequest = useDrawerResident(request);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRating(5);
      setComment('');
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!residentRequest || !viewerId) return false;
    return residentRequest.status === 'pending' && residentRequest.buyerId === viewerId;
  }, [residentRequest, viewerId]);

  async function onSubmit() {
    if (!residentRequest || !canSubmit) return;
    setSubmitting(true);
    try {
      const nonceRes = await fetch('/api/auth/wallet-nonces', {
        credentials: 'include',
      });
      const nonceJson = (await nonceRes.json().catch(() => ({}))) as {
        nonce?: string;
        signedNonce?: string;
      };
      const nonce = typeof nonceJson.nonce === 'string' ? nonceJson.nonce : '';
      const signedNonce =
        typeof nonceJson.signedNonce === 'string' ? nonceJson.signedNonce : '';
      if (!nonce || !signedNonce) {
        toast.error('Could not create signing challenge');
        return;
      }
      const walletAuth = await MiniKit.walletAuth({
        nonce,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000),
        notBefore: new Date(Date.now() - 60 * 1000),
        statement: `Sign review submission for request ${residentRequest.requestId} with rating ${rating}/5.`,
      });
      const res = await fetch(`/api/design/dm/review-requests/${residentRequest.requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          nonce,
          signedNonce,
          walletAuthPayload: {
            status: 'success',
            address: walletAuth.data.address,
            message: walletAuth.data.message,
            signature: walletAuth.data.signature,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        request?: DmReviewRequestSnapshotPayload;
        error?: string;
      };
      if (!res.ok || !data.request) {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to submit review');
        return;
      }
      toast.success('Signed review submitted');
      onSubmitted?.(data.request);
      onOpenChange(false);
    } catch {
      toast.error('World App signature was not completed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!residentRequest) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-5">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Submit review</SheetTitle>
          <SheetDescription className="text-xs">
            Rate this transaction from 1 to 5 stars. You will sign the review in World App.
          </SheetDescription>
        </SheetHeader>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-sm font-semibold">{residentRequest.listing.title}</p>
          <p className="text-xs text-muted-foreground">${residentRequest.listing.priceUsd.toLocaleString('en-US')}</p>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                  rating === v ? 'border-foreground bg-foreground text-background' : 'border-border'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="review-comment" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Comment (optional)
          </label>
          <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1200} rows={4} className="mt-1 text-sm" />
        </div>
        <Button type="button" className="mt-5 w-full" disabled={!canSubmit || submitting} onClick={() => void onSubmit()}>
          {submitting ? 'Signing…' : 'Sign and submit review'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

