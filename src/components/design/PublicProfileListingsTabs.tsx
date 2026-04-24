'use client';

import { useState } from 'react';

import {
  PublicProfileActiveListings,
  type PublicProfileListingRow,
} from '@/components/design/PublicProfileActiveListings';
import { PublicProfileSoldListings } from '@/components/design/PublicProfileSoldListings';
import type { Listing } from '@/lib/design/data';
import type { PublicProfileSoldRow } from '@/lib/design/on-chain-sale-mock';

type TabId = 'active' | 'sold' | 'purchased';

type Props = {
  activeRows: PublicProfileListingRow[];
  soldRows: PublicProfileSoldRow[];
  purchasedRows?: PublicProfileSoldRow[];
  listingsById?: Record<string, Listing>;
};

export function PublicProfileListingsTabs({
  activeRows,
  soldRows,
  purchasedRows = [],
  listingsById,
}: Props) {
  const activeCount = activeRows.length;
  const soldCount = soldRows.length;
  const purchasedCount = purchasedRows.length;

  const [tab, setTab] = useState<TabId>(() => {
    if (activeCount > 0) return 'active';
    if (soldCount > 0) return 'sold';
    if (purchasedCount > 0) return 'purchased';
    return 'active';
  });

  const tabs: ReadonlyArray<{ id: TabId; label: string; count: number }> = [
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'sold', label: 'Sold', count: soldCount },
    { id: 'purchased', label: 'Purchased', count: purchasedCount },
  ];

  return (
    <div>
      <div className="border-b border-t border-border">
        <div className="flex px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count > 0 ? (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === t.id
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === 'active' ? (
        activeCount > 0 ? (
          <PublicProfileActiveListings
            rows={activeRows}
            listingsById={listingsById}
            hideHeader
          />
        ) : (
          <EmptyPanel
            title="No active listings"
            body="This seller doesn't have any listings on the market right now."
          />
        )
      ) : tab === 'sold' ? (
        soldCount > 0 ? (
          <div>
            <div className="px-4 pt-3">
              <p className="text-[11px] text-muted-foreground">
                Escrow completed on-chain through the app.
              </p>
            </div>
            <PublicProfileSoldListings
              rows={soldRows}
              listingsById={listingsById}
              hideHeader
            />
          </div>
        ) : (
          <EmptyPanel
            title="No completed sales yet"
            body="When a sale settles on-chain, it will show up here."
          />
        )
      ) : purchasedCount > 0 ? (
        <div>
          <div className="px-4 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Purchases completed on-chain through the app.
            </p>
          </div>
          <PublicProfileSoldListings
            rows={purchasedRows}
            listingsById={listingsById}
            hideHeader
            variant="purchased"
          />
        </div>
      ) : (
        <EmptyPanel
          title="No purchases yet"
          body="Confirmed purchases will appear here."
        />
      )}
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
