'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const MY_LISTINGS = [
  { id: '1', model: 'Rolex Submariner 126610LN', price: '$12,500', condition: 'Unworn', active: true },
  { id: '2', model: 'Tudor Black Bay 58 Navy', price: '$3,200', condition: 'Good', active: true },
  { id: '3', model: 'Omega Seamaster 300M', price: '$4,100', condition: 'Excellent', active: false },
];

type WorldIdState = 'unverified' | 'verified';

export default function ProfilePage() {
  const [worldIdState, setWorldIdState] = useState<WorldIdState>('unverified');
  const [activeTab, setActiveTab] = useState<'listings' | 'history'>('listings');

  const activeListings = MY_LISTINGS.filter((l) => l.active);
  const soldListings = MY_LISTINGS.filter((l) => !l.active);

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="relative px-4 pb-4 pt-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background">
            NK
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Nico K.</h1>
              {worldIdState === 'verified' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="size-3">
                    <path d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0zm2.78 4.47a.5.5 0 0 0-.7-.7L5.5 6.29 4.42 5.22a.5.5 0 0 0-.7.7l1.6 1.6a.5.5 0 0 0 .7 0l3-3z" />
                  </svg>
                  World Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Member since Jan 2025</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">12</span> sales
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">98%</span> positive
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{activeListings.length}</span> active
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 text-xs">
            Edit
          </Button>
        </div>

        <p className="mt-3 text-sm text-foreground/80">
          Collector focused on vintage Rolex and modern sports watches. Based in NYC. Fast shipper.
        </p>

        <div className="mt-3 flex gap-2">
          <a href="#" className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth={2} />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2.5} />
            </svg>
            Instagram
          </a>
          <a href="#" className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @nicok
          </a>
        </div>
      </div>

      {worldIdState === 'unverified' && (
        <div className="mx-4 mb-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">Verify with World ID</p>
          <p className="mt-0.5 text-xs text-foreground/70">
            Link your World ID to unlock the World Verified badge, post listings, and message sellers.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setWorldIdState('verified')}>
              Link World ID
            </Button>
            <Button size="sm" variant="outline">
              Learn more
            </Button>
          </div>
        </div>
      )}

      {worldIdState === 'verified' && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.47a.75.75 0 10-1.06-1.06L9.25 10.94 7.28 8.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l3.99-3.99z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">World ID verified</p>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/70">Your identity is verified. Badge applied to all listings.</p>
          </div>
        </div>
      )}

      <div className="border-b border-border">
        <div className="flex px-4">
          {(['listings', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'listings' ? `Active (${activeListings.length})` : `Sold (${soldListings.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {activeTab === 'listings' ? (
          activeListings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-foreground">No active listings</p>
              <p className="mt-1 text-sm text-muted-foreground">Post your first watch to get started.</p>
              <Button className="mt-4" size="sm" asChild>
                <Link href="/design/post">Post a listing</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{listing.model}</p>
                    <p className="text-xs text-muted-foreground">{listing.price} · {listing.condition}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">Edit</button>
                    <button className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">Sold</button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/design/post">+ Add listing</Link>
              </Button>
            </div>
          )
        ) : (
          soldListings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No sales history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {soldListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3 opacity-70">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">⌚</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{listing.model}</p>
                    <p className="text-xs text-muted-foreground">{listing.price} · {listing.condition}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Sold</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
