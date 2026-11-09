import type { WalletRecord } from "./auth";

export interface TreasuryAsset {
  id: string;
  treasuryId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  priceUsd: string;
  valueUsd: string;
  updatedAt?: string;
}

export interface TreasuryCount {
  transactions: number;
  approvals: number;
  rules: number;
  insights: number;
  recommendations: number;
}

export interface Treasury {
  id: string;
  name: string;
  ownerId: string;
  walletId?: string | null;
  contractAddress: string;
  chainId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  wallet?: WalletRecord;
  assets?: TreasuryAsset[];
  _count?: TreasuryCount;
}

export interface VaultSpendingStatus {
  maxTransactionAmount: string;
  dailySpendingLimit: string;
  spentToday: string;
  remainingToday: string;
}

export interface TreasuryOverview {
  treasuryId: string;
  name: string;
  contractAddress: string;
  chainId: number;
  network?: string;
  walletAddress: string;
  nativeBalance?: string;
  nativeSymbol?: string;
  vaultBalance?: string;
  vaultTokenSymbol?: string;
  vaultSpendingStatus?: VaultSpendingStatus | string | null;
  totalAssetsCount?: number;
  assets?: TreasuryAsset[];
  recentTxCount?: number;
  pendingApprovalsCount?: number;
  activeRulesCount?: number;
  recentInsights?: unknown[];
  // Backwards-compatible legacy aliases:
  nativeBnbBalance?: string;
  vaultBnbBalance?: string;
}

export interface CreateTreasuryDto {
  name: string;
  walletId?: string;
  contractAddress?: string;
  chainId?: number;
}

export interface UpdateTreasuryDto {
  name?: string;
  contractAddress?: string;
  isActive?: boolean;
}

export interface AddAssetDto {
  tokenAddress: string;
}

export interface SyncTreasuryResponse {
  syncedAt: string;
  assets: TreasuryAsset[];
}

