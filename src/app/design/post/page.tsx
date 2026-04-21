"use client";

import { createDesignListingAction } from "@/app/design/post/actions";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import { Camera, ChevronDown, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CONDITIONS = ["Unworn", "Excellent", "Good", "Fair"];
const BOX_PAPERS = ["Full set", "Box only", "Papers only", "None"];

const MAX_PHOTOS = 8;

type PhotoRow = { id: string; file: File; previewUrl: string };

function parsePriceUsd(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function NewListingPage() {
  const router = useRouter();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [priceInput, setPriceInput] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [boxPapers, setBoxPapers] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing("listingImages", {
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
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
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
    model.trim().length > 0 &&
    description.trim().length > 0 &&
    priceUsd !== null &&
    priceUsd >= 0;

  const busy = isUploading || submitting;

  async function handlePost() {
    if (!canSubmit || busy || priceUsd === null) return;

    let details = description.trim();
    if (boxPapers.trim()) {
      details += `\n\nBox & papers: ${boxPapers.trim()}`;
    }

    const files = photos.map((p) => p.file);
    let photoUfsUrls: string[];
    try {
      const uploaded = await startUpload(files);
      if (!uploaded?.length) {
        toast.error("Photo upload did not complete. Try again.");
        return;
      }
      photoUfsUrls = uploaded.map((f) => f.ufsUrl);
    } catch {
      toast.error("Photo upload failed.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDesignListingAction({
        title: model.trim(),
        details,
        priceUsd,
        condition: condition || null,
        modelNumber: null,
        photoUfsUrls,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Listing published");
      router.refresh();
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-foreground text-3xl text-background">
          ✓
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Listing posted!</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Your watch is saved to the database and appears on the design marketplace feed.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/design">Back to feed</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/design/profile">View my listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">New listing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          At least one photo, whole-dollar USD price, model / title, and a description. Uses the
          design viewer from the bottom nav (cookie).
        </p>
      </div>

      <div className="space-y-5">
        <section>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Photos <span className="text-rose-500">*</span>
          </label>
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={async (e) => {
              await appendFromFiles(e.target.files);
              e.target.value = "";
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
              e.target.value = "";
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
                  Upload
                </Button>
              </div>
            )}
          </div>
          {photos.length === 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Use Camera for a new shot or Upload to pick from your library (up to {MAX_PHOTOS}{" "}
              photos).
            </p>
          )}
        </section>

        <section>
          <label
            htmlFor="model"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Model / reference <span className="text-rose-500">*</span>
          </label>
          <input
            id="model"
            type="text"
            placeholder="e.g. Rolex Submariner 126610LN"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </section>

        <section>
          <label
            htmlFor="price"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Price (USD, whole dollars) <span className="text-rose-500">*</span>
          </label>
          <input
            id="price"
            inputMode="numeric"
            placeholder="e.g. 12500"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </section>

        <section>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the watch — condition, history, what's included…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
          />
        </section>

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto justify-start gap-1.5 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowOptional((v) => !v)}
          >
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${showOptional ? "rotate-180" : ""}`}
              aria-hidden
            />
            {showOptional ? "Hide" : "Add"} optional details
          </Button>
        </div>

        {showOptional && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <section>
              <label className="mb-2 block text-sm font-semibold text-foreground">Condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={condition === c ? "default" : "outline"}
                    size="xs"
                    className="rounded-full px-3"
                    onClick={() => setCondition(condition === c ? "" : c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </section>

            <section>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Box &amp; Papers
              </label>
              <div className="flex flex-wrap gap-2">
                {BOX_PAPERS.map((bp) => (
                  <Button
                    key={bp}
                    type="button"
                    variant={boxPapers === bp ? "default" : "outline"}
                    size="xs"
                    className="rounded-full px-3"
                    onClick={() => setBoxPapers(boxPapers === bp ? "" : bp)}
                  >
                    {bp}
                  </Button>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="rounded-xl border border-world-verified/35 bg-world-verified/10 p-3">
          <p className="text-xs text-foreground/70">
            Link World ID from Profile to earn the World Verified badge on your listings.
          </p>
        </div>

        <Button className="w-full" disabled={!canSubmit || busy} onClick={() => void handlePost()}>
          {isUploading ? "Uploading photos…" : submitting ? "Publishing…" : "Post listing"}
        </Button>
      </div>
    </div>
  );
}
