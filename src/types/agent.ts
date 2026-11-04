export interface AgentInsight {
  id?: string;
  treasuryId?: string;
  title: string;
  description: string;
  type: "BALANCE" | "SECURITY" | "PERFORMANCE" | string;
  severity: "INFO" | "WARNING" | "CRITICAL" | string;
  isRead?: boolean;
  metadata?: unknown;
  createdAt?: string;
}

export interface AgentRecommendation {
  id?: string;
  treasuryId?: string;
  title: string;
  description: string;
  actionType: "DEPOSIT" | "TRANSFER" | "REBALANCE" | "RULE" | string;
  amount?: string;
  tokenAddress?: string | null;
  tokenSymbol?: string;
  recipientAddress?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | string;
  confidence?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentChatMessage {
  id: string;
  userId?: string;
  treasuryId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  metadata?: {
    insightsCount?: number;
    recommendationsCount?: number;
  } | null;
  insights?: AgentInsight[];
  recommendations?: AgentRecommendation[];
  createdAt: string;
}

export interface AgentChatResponseData {
  reply: string;
  insights?: AgentInsight[];
  recommendations?: AgentRecommendation[];
}

export interface AgentAnalysisData {
  analyzedTransactionsCount: number;
  anomaliesDetectedCount: number;
  anomalies: unknown[];
  savedInsights: AgentInsight[];
}

