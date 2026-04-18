'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { FEATURED_LISTING_ID } from '@/lib/design-jae-listings-dummy';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export function JaeNewListingForm() {
  const [verified, setVerified] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [condition, setCondition] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = verified && title.trim().length > 0 && details.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-base font-semibold text-foreground">Listing published (design stub)</h2>
        <p className="text-sm text-muted-foreground">
          In production we&apos;d persist to the database and redirect to your new listing. For now,
          continue exploring the sample detail page.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/design/jae/listings/${FEATURED_LISTING_ID}`}
            className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'inline-flex justify-center')}
          >
            View sample listing
          </Link>
          <Link
            href="/design/jae/listings"
            className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'inline-flex justify-center')}
          >
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/15 p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="new-listing-verified" className="text-sm font-normal text-muted-foreground">
            Design only: simulate World ID verified
          </Label>
          <Switch id="new-listing-verified" checked={verified} onCheckedChange={setVerified} />
        </div>
        {!verified ? (
          <Alert variant="destructive">
            <AlertTitle>World ID required</AlertTitle>
            <AlertDescription>
              You must verify with World ID before creating a listing. Toggle above to preview the
              enabled form in this sandbox.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="listing-title">Title</Label>
        <Input
          id="listing-title"
          placeholder="e.g. Rolex Datejust 41 — mint dial, Jubilee"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!verified}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="listing-details">Details</Label>
        <Textarea
          id="listing-details"
          placeholder="Condition, box & papers, story, what you’re looking for in a trade…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={!verified}
          required
          className="min-h-[140px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-condition">Condition (optional)</Label>
          <Input
            id="listing-condition"
            placeholder="e.g. Unworn, light wear"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            disabled={!verified}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="listing-model">Model # (optional)</Label>
          <Input
            id="listing-model"
            placeholder="e.g. 126300"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            disabled={!verified}
          />
        </div>
      </div>

      <Separator />

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!canSubmit}>
        Publish listing
      </Button>
    </form>
  );
}
