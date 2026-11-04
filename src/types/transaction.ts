export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "TRANSFER"
  | "APPROVAL"
  | "CONTRACT_EXECUTION";

export type TransactionStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "REJECTED";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

export interface Transaction {
  id: string;
  treasuryId: string;
  txHash?: string | null;
  fromAddress: string;
  toAddress: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  reason?: string | null;
  approvalId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Approval {
  id: string;
  treasuryId: string;
  actionType: TransactionType;
  tokenAddress?: string | null;
  tokenSymbol?: string;
  amount?: string;
  recipientAddress?: string;
  reason?: string | null;
  status: ApprovalStatus;
  expiresAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  txHash?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProposeTransactionDto {
  treasuryId: string;
  toAddress: string;
  amount: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  type?: TransactionType;
  reason?: string;
}

export interface RecordTransactionDto {
  treasuryId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  type?: TransactionType;
  approvalId?: string;
}

export interface ExecuteApprovalDto {
  txHash: string;
}

export interface PaginatedTransactionsResponse {
  items: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProposeTransactionResponseData {
  message: string;
  approval: Approval;
}

