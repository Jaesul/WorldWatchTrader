import { formatUnits } from 'viem';

import type { OnChainSettlement } from '@/lib/design/on-chain-sale-mock';
import type { ViewerDashboardDealSnapshot } from '@/lib/viewer/dashboard';

export type DealSettlementFields = Pick<
  ViewerDashboardDealSnapshot,
  'txHash' | 'userOpHash' | 'chainName' | 'tokenSymbol' | 'amountRaw'
>;

/** Human-readable token amount from DB raw integer string. */
export function formatTokenAmountHuman(tokenSymbol: string, amountRaw: string): string {
  if (!amountRaw || !/^\d+$/.test(amountRaw)) return amountRaw;
  try {
    if (tokenSymbol === 'WLD' || tokenSymbol === 'ETH') {
      return `${formatUnits(BigInt(amountRaw), 18)} ${tokenSymbol}`;
    }
    if (tokenSymbol === 'USDC') {
      return `${formatUnits(BigInt(amountRaw), 6)} USDC`;
    }
  } catch {
    return amountRaw;
  }
  return amountRaw;
}

/** `0x` + 64 hex — suitable for Worldscan. */
export function isExplorerTxHash(value: string | null | undefined): boolean {
  return !!value && /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

/**
 * Builds {@link OnChainSettlement} for receipt UIs. Prefers a real on-chain hash for display
 * and explorer; otherwise falls back to the MiniKit payment id (`userOpHash`).
 */
export function buildReceiptOnChainSettlement(
  deal: DealSettlementFields,
  fallback: OnChainSettlement,
  confirmedAtLabel: string,
): OnChainSettlement {
  const chainTx = deal.txHash?.trim() && isExplorerTxHash(deal.txHash) ? deal.txHash.trim() : '';
  const paymentRef = deal.userOpHash?.trim() || '';
  const displayHash = chainTx || paymentRef;

  return {
    txHash: displayHash,
    chainName: (deal.chainName || fallback.chainName) as string,
    token: (deal.tokenSymbol || fallback.token) as string,
    amount:
      formatTokenAmountHuman(deal.tokenSymbol, deal.amountRaw) ||
      deal.amountRaw ||
      fallback.amount,
    confirmedAtLabel,
  };
}
