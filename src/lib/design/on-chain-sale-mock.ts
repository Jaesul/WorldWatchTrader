/**
 * Design sandbox: mock on-chain settlement metadata for sold listings.
 * Replace with indexer / receipt payload when wiring production.
 */

import type { ViewerDashboardDealSnapshot } from '@/lib/viewer/dashboard';

export type OnChainSettlement = {
  txHash: string;
  chainName: string;
  token: string;
  amount: string;
  confirmedAtLabel: string;
  /**
   * When false, do not link to Worldscan even if {@link txHash} matches a 32-byte hex pattern
   * (e.g. deterministic design mocks are not real chain transactions).
   */
  explorerLinkEligible?: boolean;
};

export type PublicProfileSoldRow = {
  listingId: string;
  soldAtLabel: string;
  settlement: OnChainSettlement;
  /**
   * Full deal snapshot used when opening the row's receipt drawer. Optional so
   * legacy mock callers without a real deal can still pass minimal rows; in
   * that case the drawer falls back to derived placeholder values.
   */
  deal?: ViewerDashboardDealSnapshot;
  /**
   * Whether this row represents a sale by the profile owner (`'sale'`) or a
   * purchase made by them (`'purchase'`). Defaults to `'sale'`.
   */
  perspective?: 'sale' | 'purchase';
};

function djb2(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

function hexFromSeed(seed: string, byteLen = 32) {
  const hex = '0123456789abcdef';
  let out = '';
  let x = djb2(seed);
  for (let i = 0; i < byteLen * 2; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out += hex[x & 15];
  }
  return `0x${out}`;
}

/** Deterministic mock user-operation hash (distinct from `tx:` seed in settlement). */
export function mockUserOpHashForListing(input: {
  listingId: string;
  updatedAt: Date;
  priceUsd: number;
}): string {
  const seed = `uop:${input.listingId}:${input.updatedAt.toISOString()}:${input.priceUsd}`;
  return hexFromSeed(seed);
}

/** Deterministic sandbox row parts from listing id + timestamps + price. */
export function buildMockPublicProfileSoldParts(input: {
  listingId: string;
  updatedAt: Date;
  priceUsd: number;
}): { soldAtLabel: string; settlement: OnChainSettlement } {
  const seed = `${input.listingId}:${input.updatedAt.toISOString()}:${input.priceUsd}`;
  const h = djb2(seed);
  const token = h % 3 === 0 ? 'WLD' : 'USDC';
  const amount =
    token === 'USDC'
      ? input.priceUsd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : (input.priceUsd / 2.4).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const soldAt = input.updatedAt;
  const soldAtLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(soldAt);
  const confirmedAtLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(soldAt);
  return {
    soldAtLabel,
    settlement: {
      txHash: hexFromSeed(`tx:${seed}`),
      chainName: 'World Chain',
      token,
      amount,
      confirmedAtLabel,
      explorerLinkEligible: false,
    },
  };
}

export const WORLD_CHAIN_MAINNET_ID = 480;
export const WORLD_CHAIN_SEPOLIA_ID = 4801;

/**
 * Worldscan URLs for World Chain mainnet and Sepolia.
 * @see https://docs.worldcoin.org/world-chain/providers/explorers
 */
export function explorerTxUrl(
  txHash: string,
  chainId: number = WORLD_CHAIN_MAINNET_ID,
): string {
  if (chainId === WORLD_CHAIN_SEPOLIA_ID) {
    return `https://sepolia.worldscan.org/tx/${txHash}`;
  }
  return `https://worldscan.org/tx/${txHash}`;
}
