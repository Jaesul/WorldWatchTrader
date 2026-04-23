import { Skeleton } from '@/components/ui/skeleton';

export function DesignDmInboxSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 shrink-0 rounded" />
              <Skeleton className="h-3 flex-1 max-w-[200px]" />
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
            <Skeleton className="h-3 w-full max-w-[280px]" />
          </div>
        </li>
      ))}
    </ul>
  );
}
