import Link from 'next/link';
import { Button } from '@/components/ui/button';

const SELLER_DATA: Record<string, {
  name: string;
  bio: string;
  memberSince: string;
  verified: boolean;
  powerSeller: boolean;
  sales: number;
  positiveRate: number;
  instagram: string | null;
  twitter: string | null;
  listings: { id: string; model: string; price: string; condition: string }[];
}> = {
  alexkim: {
    name: 'Alex Kim',
    bio: 'Rolex and AP collector based in LA. Only selling genuine watches from my personal collection. Quick shipper.',
    memberSince: 'March 2024',
    verified: true,
    powerSeller: true,
    sales: 17,
    positiveRate: 100,
    instagram: '@alexkimwatches',
    twitter: null,
    listings: [
      { id: '1', model: 'Rolex Submariner 126610LN', price: '$12,500', condition: 'Unworn' },
    ],
  },
  harbortime: {
    name: 'Harbor Time Co.',
    bio: 'Boutique dealer. All watches fully authenticated and serviced in-house before listing.',
    memberSince: 'Oct 2023',
    verified: true,
    powerSeller: false,
    sales: 8,
    positiveRate: 98,
    instagram: '@harbortime',
    twitter: '@harbortime',
    listings: [
      { id: '2', model: 'Omega Speedmaster Professional', price: '$5,800', condition: 'Excellent' },
    ],
  },
  marcor: {
    name: 'Marco R.',
    bio: 'Serious collector. Specializing in Patek and vintage Rolex. Only deal with verified buyers.',
    memberSince: 'Jun 2024',
    verified: false,
    powerSeller: true,
    sales: 14,
    positiveRate: 96,
    instagram: null,
    twitter: null,
    listings: [
      { id: '3', model: 'Patek Philippe Nautilus 5711/1A', price: '$120,000', condition: 'Like new' },
    ],
  },
};

const FALLBACK = {
  name: 'Unknown Seller',
  bio: 'No profile available for this handle.',
  memberSince: '—',
  verified: false,
  powerSeller: false,
  sales: 0,
  positiveRate: 0,
  instagram: null,
  twitter: null,
  listings: [],
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const seller = SELLER_DATA[handle] ?? FALLBACK;

  const avatarUrl = `https://i.pravatar.cc/150?u=${handle}`;

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt={seller.name}
            className="size-16 shrink-0 rounded-full object-cover bg-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground">{seller.name}</h1>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-world-verified/15 px-2 py-0.5 text-[10px] font-semibold text-world-verified">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                    <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm2.78 4.47a.5.5 0 0 0-.7-.7L5.5 6.29 4.42 5.22a.5.5 0 0 0-.7.7l1.6 1.6a.5.5 0 0 0 .7 0l3-3z" />
                  </svg>
                  World Verified
                </span>
              )}
              {seller.powerSeller && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                    <path d="M6 .5a.5.5 0 0 1 .45.28l1.25 2.54 2.8.41a.5.5 0 0 1 .28.85L8.76 6.55l.51 2.79a.5.5 0 0 1-.72.53L6 8.6 3.45 9.87a.5.5 0 0 1-.72-.53l.51-2.79L1.22 4.58a.5.5 0 0 1 .28-.85l2.8-.41L5.55.78A.5.5 0 0 1 6 .5z" />
                  </svg>
                  Power Seller
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Member since {seller.memberSince}</p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{seller.bio}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{seller.positiveRate}%</p>
            <p className="text-[10px] font-medium text-muted-foreground">Positive</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{seller.sales}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Sales</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{seller.verified ? '✓' : '—'}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Verified</p>
          </div>
        </div>

        {(seller.instagram || seller.twitter) && (
          <div className="mt-3 flex gap-2">
            {seller.instagram && (
              <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2.5} />
                </svg>
                {seller.instagram}
              </span>
            )}
            {seller.twitter && (
              <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {seller.twitter}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" asChild>
            <Link href={`/design/messages/seller-${handle}`}>Message seller</Link>
          </Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {seller.listings.length > 0 && (
        <div>
          <div className="border-b border-t border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Active listings ({seller.listings.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {seller.listings.map((listing) => (
              <Link
                key={listing.id}
                href="/design"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{listing.model}</p>
                  <p className="text-xs text-muted-foreground">{listing.price} · {listing.condition}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4 shrink-0 text-muted-foreground">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mt-6 flex justify-end">
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">Report user</button>
      </div>
    </div>
  );
}
