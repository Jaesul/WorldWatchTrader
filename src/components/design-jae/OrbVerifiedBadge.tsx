import { WorldOrbIcon } from '@/components/icons/world-orb';
import { cn } from '@/lib/utils';

type MarkProps = {
  className?: string;
};

/** Circular badge containing the orb glyph (for overlap layouts). */
export function OrbVerifiedMark({ className }: MarkProps) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-world-verified text-world-verified-foreground shadow-md ring-2 ring-background sm:size-10',
        className,
      )}
      role="img"
      aria-label="Orb verified — listed by a World ID verified seller"
    >
      <WorldOrbIcon className="size-[18px] sm:size-5" />
    </span>
  );
}

