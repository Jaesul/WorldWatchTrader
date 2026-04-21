/**
 * Design sandbox: mock on-chain settlement metadata for “sold via app escrow” rows.
 * Replace with indexer / receipt payload when wiring production.
 */

export type OnChainSettlement = {
  txHash: string;
  blockNumber: number;
  chainName: string;
  token: string;
  amount: string;
  confirmedAtLabel: string;
};

export type PublicProfileSoldRow = {
  listingId: string;
  soldAtLabel: string;
  settlement: OnChainSettlement;
};

/** Placeholder explorer base (World Chain–style); link is illustrative only. */
export function explorerTxUrl(txHash: string): string {
  return `https://worldscan.org/tx/${txHash}`;
}
