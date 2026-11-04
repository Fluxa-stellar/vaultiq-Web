export interface TreasurySnapshot {
  id: string;
  treasuryId: string;
  totalValueUsd: string;
  bnbValueUsd: string;
  usdtValueUsd: string;
  usdcValueUsd: string;
  createdAt: string;
}

export interface AnalyticsAssetItem {
  symbol: string;
  name: string;
  balance: string;
  tokenAddress: string;
}

export interface TreasuryAnalyticsData {
  treasuryId: string;
  totalInflow: string;
  totalOutflow: string;
  netFlow: string;
  transactionCount: number;
  typeCounts: Record<string, number>;
  monthlySpending: Record<string, number>;
  assetAllocation: AnalyticsAssetItem[];
}

