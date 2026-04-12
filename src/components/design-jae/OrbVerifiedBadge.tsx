import { cn } from '@/lib/utils';

/** World ID orb mark — matches `public/orb.svg` for `currentColor` theming. */
function OrbGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M9.96783 18.9357C14.9206 18.9357 18.9357 14.9206 18.9357 9.96783C18.9357 5.01503 14.9206 1 9.96783 1C5.01503 1 1 5.01503 1 9.96783C1 14.9206 5.01503 18.9357 9.96783 18.9357Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M10.0406 10.5109C11.5667 10.5109 12.8038 9.27372 12.8038 7.74762C12.8038 6.22152 11.5667 4.98438 10.0406 4.98438C8.51449 4.98438 7.27734 6.22152 7.27734 7.74762C7.27734 9.27372 8.51449 10.5109 10.0406 10.5109Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M7.07422 13.9844H12.9767"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
    </svg>
  );
}

type MarkProps = {
  className?: string;
};

/** Circular badge containing the orb glyph (for overlap layouts). */
export function OrbVerifiedMark({ className }: MarkProps) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1C3240] text-white shadow-md ring-2 ring-background sm:size-10 [&>svg]:size-[18px] sm:[&>svg]:size-5',
        className,
      )}
      role="img"
      aria-label="Orb verified — listed by a World ID verified seller"
    >
      <OrbGlyph />
    </span>
  );
}

