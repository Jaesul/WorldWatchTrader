"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { addListing } from "@/lib/design/listing-store";

const CONDITIONS = ["Unworn", "Excellent", "Good", "Fair"];
const BOX_PAPERS = ["Full set", "Box only", "Papers only", "None"];
const CURRENCIES = ["USD", "EUR", "GBP", "CHF"];

export default function NewListingPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [boxPapers, setBoxPapers] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    price.trim() !== "" && model.trim() !== "" && description.trim() !== "";

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
          <div className="flex flex-wrap gap-2">
            {photos.map((_, i) => (
              <div
                key={i}
                className="relative flex size-20 items-center justify-center rounded-xl border border-border/60 bg-muted text-2xl"
              >
                ⌚
                <button
                  onClick={() =>
                    setPhotos((prev) => prev.filter((__, j) => j !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 8 && (
              <button
                onClick={() => setPhotos((prev) => [...prev, "placeholder"])}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/60"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="size-5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[10px]">Add photo</span>
              </button>
            )}
          </div>
          {photos.length === 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Tap + to add a photo (placeholder in sandbox)
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
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`size-4 transition-transform ${showOptional ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showOptional ? "Hide" : "Add"} optional details
          </button>
        </div>

        {showOptional && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <section>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Condition
              </label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCondition(condition === c ? "" : c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${condition === c ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Box &amp; Papers
              </label>
              <div className="flex flex-wrap gap-2">
                {BOX_PAPERS.map((bp) => (
                  <button
                    key={bp}
                    onClick={() => setBoxPapers(boxPapers === bp ? "" : bp)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${boxPapers === bp ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}
                  >
                    {bp}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="rounded-xl border border-world-verified/35 bg-world-verified/10 p-3">
          <p className="text-xs font-semibold text-world-verified">
            World ID is optional
          </p>
          <p className="mt-0.5 text-xs text-foreground/70">
            You can post with a normal account. Link World ID from Profile to
            earn the World Verified badge on your listings.
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
