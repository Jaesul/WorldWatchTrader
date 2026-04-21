'use client';

import { createAndPublishListingAction } from '@/app/(app)/(protected)/listings/new/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';
import { Camera, ImagePlus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_PHOTOS = 8;
const CONDITIONS = ['Unworn', 'Excellent', 'Good', 'Fair'] as const;

type PhotoRow = { id: string; file: File; previewUrl: string };

function parsePriceUsd(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function NewListingForm({ className }: { className?: string }) {
  const router = useRouter();
  const formId = useId();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [condition, setCondition] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing('listingImages', {
    onUploadError: (error) => {
      toast.error(error.message);
    },
  });

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const row = prev.find((p) => p.id === id);
      if (row) URL.revokeObjectURL(row.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => {
      for (const p of photosRef.current) {
        URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  async function appendFromFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (room <= 0) return prev;
      const slice = files.slice(0, room);
      const next: PhotoRow[] = slice.map((file) => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
  }

  const priceUsd = parsePriceUsd(priceInput);
  const canSubmit =
    photos.length > 0 &&
    title.trim().length > 0 &&
    details.trim().length > 0 &&
    priceUsd !== null &&
    priceUsd >= 0;

  const busy = isUploading || submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy || priceUsd === null) return;

    const files = photos.map((p) => p.file);
    let photoUfsUrls: string[];
    try {
      const uploaded = await startUpload(files);
      if (!uploaded?.length) {
        toast.error('Photo upload did not complete. Try again.');
        return;
      }
      photoUfsUrls = uploaded.map((f) => f.ufsUrl);
    } catch {
      toast.error('Photo upload failed.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAndPublishListingAction({
        title: title.trim(),
        details: details.trim(),
        priceUsd,
        condition: condition || null,
        modelNumber: modelNumber.trim() || null,
        photoUfsUrls,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Listing published');
      router.push(`/listings/${result.listingId}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className={cn('flex flex-col gap-5', className)}>
      <section>
        <Label className="mb-2 block text-sm font-semibold text-foreground">
          Photos <span className="text-rose-500">*</span>
        </Label>
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={async (e) => {
            await appendFromFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={async (e) => {
            await appendFromFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap gap-2">
          {photos.map((item) => (
            <div
              key={item.id}
              className="relative size-20 overflow-hidden rounded-xl border border-border/60 bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="size-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className="absolute -right-1.5 -top-1.5 size-5 min-h-0 rounded-full p-0 shadow-sm"
                onClick={() => removePhoto(item.id)}
                aria-label="Remove photo"
              >
                <X className="size-3" strokeWidth={2.5} />
              </Button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <div
              className="flex h-20 w-[7.25rem] overflow-hidden rounded-xl border border-dashed border-border bg-muted/30"
              role="group"
              aria-label="Add photos"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-full min-h-0 flex-1 flex-col gap-0.5 rounded-none px-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="size-4 shrink-0" aria-hidden />
                Camera
              </Button>
              <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-full min-h-0 flex-1 flex-col gap-0.5 rounded-none px-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                onClick={() => libraryInputRef.current?.click()}
              >
                <ImagePlus className="size-4 shrink-0" aria-hidden />
                Library
              </Button>
            </div>
          )}
        </div>
        {photos.length === 0 ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Use Camera for a new shot or Library to pick photos (up to {MAX_PHOTOS}).
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-title`}>Title</Label>
        <Input
          id={`${formId}-title`}
          placeholder="e.g. Rolex Datejust 41 — mint dial"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-price`}>Price (USD, whole dollars)</Label>
        <Input
          id={`${formId}-price`}
          inputMode="numeric"
          placeholder="e.g. 12500"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-details`}>Description</Label>
        <Textarea
          id={`${formId}-details`}
          placeholder="Condition, box & papers, story…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
          className="min-h-[140px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${formId}-model`}>Model number (optional)</Label>
        <Input
          id={`${formId}-model`}
          placeholder="e.g. 126334"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Condition (optional)</span>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Button
              key={c}
              type="button"
              variant={condition === c ? 'default' : 'outline'}
              size="xs"
              className="rounded-full px-3"
              onClick={() => setCondition(condition === c ? '' : c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || busy}>
        {isUploading ? 'Uploading photos…' : submitting ? 'Publishing…' : 'Publish listing'}
      </Button>

      <Button type="button" variant="ghost" size="sm" className="w-full" asChild>
        <Link href="/listings">Cancel</Link>
      </Button>
    </form>
  );
}
