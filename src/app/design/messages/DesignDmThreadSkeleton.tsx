import { Skeleton } from '@/components/ui/skeleton';

/** Matches the layout of the design DM thread view (header, bubbles, composer). */
export function DesignDmThreadSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-3 sm:px-4">
        <Skeleton className="size-5 shrink-0 rounded" />
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-3">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-11 w-[72%] max-w-[280px] rounded-2xl rounded-br-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-14 w-[78%] max-w-[300px] rounded-2xl rounded-bl-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-9 w-[55%] max-w-[220px] rounded-2xl rounded-br-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      </div>
      <div className="sticky bottom-0 z-20 border-t border-border bg-background px-4 pb-3 pt-2">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-2xl" />
            <Skeleton className="size-10 shrink-0 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
