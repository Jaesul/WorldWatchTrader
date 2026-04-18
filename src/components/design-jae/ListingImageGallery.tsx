'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type Props = {
  alt: string;
  heroUrl: string;
  galleryUrls: readonly string[];
  className?: string;
};

export function ListingImageGallery({ alt, heroUrl, galleryUrls, className }: Props) {
  const all = [heroUrl, ...galleryUrls];
  const [index, setIndex] = useState(0);
  const current = all[index] ?? heroUrl;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        <Image
          src={current}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />
      </div>
      <ScrollArea className="w-full pb-1">
        <div className="flex w-max gap-2 pr-4">
          {all.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all',
                i === index ? 'ring-primary' : 'ring-transparent opacity-80 hover:opacity-100',
              )}
            >
              <Image
                src={src}
                alt={`${alt} — thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
