export interface AgentAllowance {
  id: string;
  address: string;
  name: string;
  roleTag: string;
  dailyLimit: number; // in tUSD8
  spentToday: number; // in tUSD8
  maxSingleTxLimit: number; // in tUSD8
  enforceWhitelist: boolean;
  whitelistedRecipients: string[];
  lastResetTimestamp: number;
  isActive: boolean;
  avatarBg?: string;
}

export interface SetAgentConfigDto {
  agentAddress: string;
  name: string;
  roleTag: string;
  dailyLimit: number;
  maxSingleTxLimit: number;
  enforceWhitelist: boolean;
  whitelistedRecipients?: string[];
}

export interface SimulatedSpendRequest {
  agentAddress: string;
  recipientAddress: string;
  amount: number;
  purpose: string;
  txHash?: string;
}

export interface SimulatedSpendResult {
  success: boolean;
  txHash?: string;
  isSimulated?: boolean;
  errorMessage?: string;
  reason?: "DAILY_LIMIT_EXCEEDED" | "SINGLE_TX_CEILING_EXCEEDED" | "WHITELIST_REJECTED" | "CONTRACT_REVERT";
  agent: AgentAllowance;
  amount: number;
  timestamp: string;
}

export interface AuditStreamItem {
  id: string;
  timestamp: string;
  agentAddress: string;
  agentName: string;
  recipient: string;
  recipientName?: string;
  amount: number; // tUSD8
  currency: "tUSD8" | "tQDAY";
  purpose: string;
  txHash: string;
  isAutonomous: boolean;
  type: "AI_SPEND" | "MANUAL_WITHDRAWAL" | "VAULT_DEPOSIT" | "CONFIG_UPDATE";
  status: "CONFIRMED" | "REVERTED_BLOCKED";
}

