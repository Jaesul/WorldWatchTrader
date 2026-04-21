"use client";

import { useRef, useState } from "react";
import { Camera, ChevronDown, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { addListing } from "@/lib/design/listing-store";

const CONDITIONS = ["Unworn", "Excellent", "Good", "Fair"];
const BOX_PAPERS = ["Full set", "Box only", "Papers only", "None"];
const CURRENCIES = ["USD", "EUR", "GBP", "CHF"];

const MAX_PHOTOS = 8;

type PhotoItem = { id: string; dataUrl: string };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function NewListingPage() {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [boxPapers, setBoxPapers] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    photos.length > 0 &&
    price.trim() !== "" &&
    model.trim() !== "" &&
    description.trim() !== "";

  async function appendImagesFromFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    const dataUrls: string[] = [];
    for (const file of files) {
      try {
        dataUrls.push(await readFileAsDataUrl(file));
      } catch {
        /* ignore single file errors */
      }
    }
    if (!dataUrls.length) return;
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (room <= 0) return prev;
      const next = dataUrls.slice(0, room).map((dataUrl) => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        dataUrl,
      }));
      return [...prev, ...next];
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-foreground text-3xl text-background">
          ✓
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Listing posted!
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Your watch is now live in the feed. Buyers can reply directly.
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
          At least one photo, a price, a model name, and a description are
          required.
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
              await appendImagesFromFiles(e.target.files);
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
              await appendImagesFromFiles(e.target.files);
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
                <img
                  src={item.dataUrl}
                  alt=""
                  className="size-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="absolute -right-1.5 -top-1.5 size-5 min-h-0 rounded-full p-0 shadow-sm"
                  onClick={() =>
                    setPhotos((prev) => prev.filter((p) => p.id !== item.id))
                  }
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
                <div
                  className="w-px shrink-0 self-stretch bg-border"
                  aria-hidden
                />
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
              Use Camera for a new shot or Upload to pick from your library (up
              to {MAX_PHOTOS} photos).
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
            Price <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              id="price"
              type="number"
              placeholder="0"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
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
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Condition
              </label>
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

        <Button
          className="w-full"
          disabled={!isValid}
          onClick={() => {
            addListing({
              model,
              price: parseFloat(price) || 0,
              currency,
              description,
              condition,
              boxPapers,
              photoCount: photos.length,
              photo: photos[0].dataUrl,
            });
            setSubmitted(true);
          }}
        >
          Post listing
        </Button>
      </div>
    </div>
  );
}
