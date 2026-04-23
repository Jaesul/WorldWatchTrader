import type { ListingStatus } from '@/lib/design/listing-store';

export const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; description: string; color: string }
> = {
  draft: {
    label: 'Draft',
    description: 'Not yet published — invisible in feed',
    color: 'bg-muted text-muted-foreground border-border',
  },
  active: {
    label: 'Active',
    description: 'Live in feed — open for messages',
    color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
  pending: {
    label: 'Pending',
    description: 'Deal in progress — hidden from feed',
    color: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  },
  sold: {
    label: 'Sold',
    description: 'Transaction complete — moved to history',
    color: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  archived: {
    label: 'Archived',
    description: 'Manually removed — no review triggered',
    color: 'bg-muted text-muted-foreground/60 border-border/60',
  },
};
