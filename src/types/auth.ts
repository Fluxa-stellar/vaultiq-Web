export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface GetNonceRequest {
  address: string;
}

export interface NonceData {
  address: string;
  nonce: string;
  expiresAt: string;
  message: string;
}

export interface VerifySignatureRequest {
  address: string;
  signature: string;
  message: string;
}

export interface AuthSessionData {
  accessToken: string;
  token?: string;
  tokenType?: string;
  user: UserProfile;
}

export interface WalletRecord {
  id: string;
  address: string;
  chainId?: number;
  isPrimary?: boolean;
  isActive?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  wallets?: WalletRecord[];
  treasuries?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectWalletRequest {
  address: string;
  chainId?: number;
}

export interface WalletBalanceResponse {
  address: string;
  balance: string;
  symbol: string;
  chainId: number;
}
