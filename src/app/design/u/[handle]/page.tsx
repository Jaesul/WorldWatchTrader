import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PublicProfileActiveListings } from '@/components/design/PublicProfileActiveListings';
import { PublicProfileSoldListings } from '@/components/design/PublicProfileSoldListings';
import type { PublicProfileSoldRow } from '@/lib/design/on-chain-sale-mock';

const SELLER_DATA: Record<string, {
  name: string;
  bio: string;
  memberSince: string;
  verified: boolean;
  powerSeller: boolean;
  sales: number;
  positiveRate: number;
  listings: { id: string; model: string; price: string; condition: string }[];
  soldListings: PublicProfileSoldRow[];
}> = {
  alexkim: {
    name: 'Alex Kim',
    bio: 'Rolex and AP collector based in LA. Only selling genuine watches from my personal collection. Quick shipper.',
    memberSince: 'March 2024',
    verified: true,
    powerSeller: true,
    sales: 17,
    positiveRate: 100,
    listings: [
      { id: '1', model: 'Rolex Submariner 126610LN', price: '$12,500', condition: 'Unworn' },
    ],
    soldListings: [
      {
        listingId: '8',
        soldAtLabel: 'Oct 2024',
        settlement: {
          txHash: '0x8a4f61c2e9d0b1a3567890abcdef1234567890abcdef1234567890abcdef12',
          blockNumber: 18_452_301,
          chainName: 'World Chain',
          token: 'USDC',
          amount: '9,200.00',
          confirmedAtLabel: 'Oct 3, 2024 · 2:18 PM',
        },
      },
      {
        listingId: '9',
        soldAtLabel: 'Aug 2024',
        settlement: {
          txHash: '0x2c91de44f7aa00bb334567890abcdef1234567890abcdef1234567890abcd',
          blockNumber: 18_389_104,
          chainName: 'World Chain',
          token: 'USDC',
          amount: '18,100.00',
          confirmedAtLabel: 'Aug 21, 2024 · 9:05 AM',
        },
      },
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
    listings: [
      { id: '2', model: 'Omega Speedmaster Professional', price: '$5,800', condition: 'Excellent' },
    ],
    soldListings: [
      {
        listingId: '10',
        soldAtLabel: 'Jan 2025',
        settlement: {
          txHash: '0xf301aa558812ccdd44556677889900aabbccddeeff00112233445566778899',
          blockNumber: 18_601_882,
          chainName: 'World Chain',
          token: 'USDC',
          amount: '4,450.00',
          confirmedAtLabel: 'Jan 8, 2025 · 4:52 PM',
        },
      },
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
    listings: [
      { id: '12', model: 'Rolex Datejust 41 126334', price: '$9,800', condition: 'Excellent' },
    ],
    soldListings: [
      {
        listingId: '3',
        soldAtLabel: 'Nov 2024',
        settlement: {
          txHash: '0x771199aabbccddeeff00112233445566778899aabbccddeeff001122334455',
          blockNumber: 18_512_440,
          chainName: 'World Chain',
          token: 'WLD',
          amount: '412.50',
          confirmedAtLabel: 'Nov 19, 2024 · 11:27 AM',
        },
      },
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
  listings: [],
  soldListings: [],
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

        <div className="mt-4">
          <Button className="w-full" asChild>
            <Link href={`/design/messages/seller-${handle}`}>Message seller</Link>
          </Button>
        </div>
      </div>

      {seller.listings.length > 0 && (
        <PublicProfileActiveListings rows={seller.listings} />
      )}

      {seller.soldListings.length > 0 && (
        <PublicProfileSoldListings rows={seller.soldListings} />
      )}

      <div className="mx-4 mt-6 flex justify-end">
        <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">Report user</button>
      </div>
    </div>
  );
}
