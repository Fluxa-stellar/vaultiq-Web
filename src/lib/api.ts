import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";
import type {
  ApiResponse,
  AuthSessionData,
  ConnectWalletRequest,
  NonceData,
  UserProfile,
  WalletBalanceResponse,
  WalletRecord,
} from "@/types/auth";
import type {
  AddAssetDto,
  CreateTreasuryDto,
  SyncTreasuryResponse,
  Treasury,
  TreasuryAsset,
  TreasuryOverview,
  UpdateTreasuryDto,
} from "@/types/treasury";
import type {
  AgentAnalysisData,
  AgentChatMessage,
  AgentChatResponseData,
  AgentInsight,
  AgentRecommendation,
} from "@/types/agent";
import type {
  Approval,
  ExecuteApprovalDto,
  PaginatedTransactionsResponse,
  ProposeTransactionDto,
  ProposeTransactionResponseData,
  RecordTransactionDto,
  Transaction,
} from "@/types/transaction";
import type {
  CreateRuleDto,
  Rule,
  RuleEvaluationData,
  UpdateRuleDto,
} from "@/types/rule";
import type {
  TreasuryAnalyticsData,
  TreasurySnapshot,
} from "@/types/analytics";
import type {
  NotificationStatusResponse,
  TestTelegramResponse,
  SendCustomAlertDto,
  SendCustomAlertResponse,
} from "@/types/notification";
import type { SystemHealthData } from "@/types/health";

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("vaultiq:session-expired"));
        }
      }
      const errorMessage =
        data?.message || data?.error || `Request failed with status ${res.status}`;
      throw new ApiError(errorMessage, res.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // If local endpoint was unreachable and custom URL was configured, attempt cloud backend fallback
    const fallbackBase = "https://ai-treasury-backend.onrender.com";
    if (
      !url.startsWith(fallbackBase) &&
      (error instanceof TypeError || (error instanceof Error && error.message.includes("fetch")))
    ) {
      try {
        const fallbackUrl = `${fallbackBase}/${endpoint.replace(/^\//, "")}`;
        console.warn(`Primary backend unreachable at ${url}. Attempting failover to ${fallbackUrl}`);
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
        const fallbackData = await fallbackRes.json().catch(() => null);
        if (!fallbackRes.ok) {
          const errorMessage =
            fallbackData?.message || fallbackData?.error || `Request failed with status ${fallbackRes.status}`;
          throw new ApiError(errorMessage, fallbackRes.status, fallbackData);
        }
        return fallbackData as T;
      } catch (fallbackError) {
        if (fallbackError instanceof ApiError) throw fallbackError;
      }
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred",
      0
    );
  }
}

export const authApi = {
  async getNonce(address: string): Promise<ApiResponse<NonceData>> {
    return request<ApiResponse<NonceData>>("/api/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  async verify(
    address: string,
    signature: string,
    message: string
  ): Promise<ApiResponse<AuthSessionData>> {
    return request<ApiResponse<AuthSessionData>>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature, message }),
    });
  },

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return request<ApiResponse<UserProfile>>("/api/auth/me", {
      method: "GET",
    });
  },
};

export const walletApi = {
  async connect(params: ConnectWalletRequest): Promise<ApiResponse<WalletRecord>> {
    return request<ApiResponse<WalletRecord>>("/api/wallets/connect", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async getWallets(): Promise<ApiResponse<WalletRecord[]>> {
    return request<ApiResponse<WalletRecord[]>>("/api/wallets", {
      method: "GET",
    });
  },

  async setPrimary(walletId: string): Promise<ApiResponse<WalletRecord>> {
    return request<ApiResponse<WalletRecord>>(`/api/wallets/${walletId}/primary`, {
      method: "POST",
    });
  },

  async getBalance(address: string): Promise<ApiResponse<WalletBalanceResponse>> {
    return request<ApiResponse<WalletBalanceResponse>>(
      `/api/wallets/${address}/balance`,
      {
        method: "GET",
      }
    );
  },
};

export const treasuryApi = {
  async list(): Promise<ApiResponse<Treasury[]>> {
    return request<ApiResponse<Treasury[]>>("/api/treasury", {
      method: "GET",
    });
  },

  async create(data: CreateTreasuryDto): Promise<ApiResponse<Treasury>> {
    return request<ApiResponse<Treasury>>("/api/treasury", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async get(id: string): Promise<ApiResponse<Treasury>> {
    return request<ApiResponse<Treasury>>(`/api/treasury/${id}`, {
      method: "GET",
    });
  },

  async update(id: string, data: UpdateTreasuryDto): Promise<ApiResponse<Treasury>> {
    return request<ApiResponse<Treasury>>(`/api/treasury/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getOverview(id: string): Promise<ApiResponse<TreasuryOverview>> {
    return request<ApiResponse<TreasuryOverview>>(`/api/treasury/${id}/overview`, {
      method: "GET",
    });
  },

  async getAssets(id: string): Promise<ApiResponse<TreasuryAsset[]>> {
    return request<ApiResponse<TreasuryAsset[]>>(`/api/treasury/${id}/assets`, {
      method: "GET",
    });
  },

  async addAsset(id: string, data: AddAssetDto): Promise<ApiResponse<TreasuryAsset>> {
    return request<ApiResponse<TreasuryAsset>>(`/api/treasury/${id}/assets`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async sync(id: string): Promise<ApiResponse<SyncTreasuryResponse>> {
    return request<ApiResponse<SyncTreasuryResponse>>(`/api/treasury/${id}/sync`, {
      method: "POST",
    });
  },
};

export const agentApi = {
  async chat(treasuryId: string, message: string): Promise<ApiResponse<AgentChatResponseData>> {
    return request<ApiResponse<AgentChatResponseData>>("/api/agent/chat", {
      method: "POST",
      body: JSON.stringify({ treasuryId, message }),
    });
  },

  async getMessages(treasuryId: string): Promise<ApiResponse<AgentChatMessage[]>> {
    return request<ApiResponse<AgentChatMessage[]>>(`/api/agent/${treasuryId}/messages`, {
      method: "GET",
    });
  },

  async getInsights(treasuryId: string): Promise<ApiResponse<AgentInsight[]>> {
    return request<ApiResponse<AgentInsight[]>>(`/api/agent/${treasuryId}/insights`, {
      method: "GET",
    });
  },

  async getRecommendations(treasuryId: string): Promise<ApiResponse<AgentRecommendation[]>> {
    return request<ApiResponse<AgentRecommendation[]>>(`/api/agent/${treasuryId}/recommendations`, {
      method: "GET",
    });
  },

  async analyze(treasuryId: string): Promise<ApiResponse<AgentAnalysisData>> {
    return request<ApiResponse<AgentAnalysisData>>(`/api/agent/${treasuryId}/analyze`, {
      method: "POST",
    });
  },
};

export const transactionApi = {
  async propose(data: ProposeTransactionDto): Promise<ApiResponse<ProposeTransactionResponseData>> {
    return request<ApiResponse<ProposeTransactionResponseData>>("/api/transactions/propose", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async record(data: RecordTransactionDto): Promise<ApiResponse<Transaction>> {
    return request<ApiResponse<Transaction>>("/api/transactions/record", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async list(treasuryId: string): Promise<ApiResponse<PaginatedTransactionsResponse>> {
    return request<ApiResponse<PaginatedTransactionsResponse>>(`/api/transactions/${treasuryId}`, {
      method: "GET",
    });
  },

  async pending(treasuryId: string): Promise<ApiResponse<Transaction[]>> {
    return request<ApiResponse<Transaction[]>>(`/api/transactions/${treasuryId}/pending`, {
      method: "GET",
    });
  },

  async status(treasuryId: string, txHash: string): Promise<ApiResponse<unknown>> {
    return request<ApiResponse<unknown>>(`/api/transactions/${treasuryId}/status/${txHash}`, {
      method: "GET",
    });
  },
};

export const approvalApi = {
  async list(treasuryId: string): Promise<ApiResponse<Approval[]>> {
    return request<ApiResponse<Approval[]>>(`/api/approvals/${treasuryId}`, {
      method: "GET",
    });
  },

  async get(treasuryId: string, id: string): Promise<ApiResponse<Approval>> {
    return request<ApiResponse<Approval>>(`/api/approvals/${treasuryId}/${id}`, {
      method: "GET",
    });
  },

  async approve(treasuryId: string, id: string): Promise<ApiResponse<Approval>> {
    return request<ApiResponse<Approval>>(`/api/approvals/${treasuryId}/${id}/approve`, {
      method: "POST",
    });
  },

  async reject(treasuryId: string, id: string): Promise<ApiResponse<Approval>> {
    return request<ApiResponse<Approval>>(`/api/approvals/${treasuryId}/${id}/reject`, {
      method: "POST",
    });
  },

  async execute(
    treasuryId: string,
    id: string,
    data: ExecuteApprovalDto
  ): Promise<ApiResponse<Approval>> {
    return request<ApiResponse<Approval>>(`/api/approvals/${treasuryId}/${id}/execute`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const ruleApi = {
  async list(treasuryId: string): Promise<ApiResponse<Rule[]>> {
    return request<ApiResponse<Rule[]>>(`/api/rules/${treasuryId}`, {
      method: "GET",
    });
  },

  async get(treasuryId: string, id: string): Promise<ApiResponse<Rule>> {
    return request<ApiResponse<Rule>>(`/api/rules/${treasuryId}/${id}`, {
      method: "GET",
    });
  },

  async create(treasuryId: string, data: CreateRuleDto): Promise<ApiResponse<Rule>> {
    return request<ApiResponse<Rule>>(`/api/rules/${treasuryId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(treasuryId: string, id: string, data: UpdateRuleDto): Promise<ApiResponse<Rule>> {
    return request<ApiResponse<Rule>>(`/api/rules/${treasuryId}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(treasuryId: string, id: string): Promise<ApiResponse<void>> {
    return request<ApiResponse<void>>(`/api/rules/${treasuryId}/${id}`, {
      method: "DELETE",
    });
  },

  async toggle(treasuryId: string, id: string): Promise<ApiResponse<Rule>> {
    return request<ApiResponse<Rule>>(`/api/rules/${treasuryId}/${id}/toggle`, {
      method: "POST",
    });
  },

  async evaluate(treasuryId: string): Promise<ApiResponse<RuleEvaluationData>> {
    return request<ApiResponse<RuleEvaluationData>>(`/api/rules/${treasuryId}/evaluate`, {
      method: "POST",
    });
  },
};

export const userApi = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return request<ApiResponse<UserProfile>>("/api/users/profile", {
      method: "GET",
    });
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return request<ApiResponse<UserProfile>>("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const analyticsApi = {
  async getAnalytics(treasuryId: string): Promise<ApiResponse<TreasuryAnalyticsData>> {
    return request<ApiResponse<TreasuryAnalyticsData>>(`/api/analytics/${treasuryId}`, {
      method: "GET",
    });
  },

  async getSnapshots(treasuryId: string): Promise<ApiResponse<TreasurySnapshot[]>> {
    return request<ApiResponse<TreasurySnapshot[]>>(`/api/analytics/${treasuryId}/snapshots`, {
      method: "GET",
    });
  },

  async captureSnapshot(treasuryId: string): Promise<ApiResponse<TreasurySnapshot>> {
    return request<ApiResponse<TreasurySnapshot>>(`/api/analytics/${treasuryId}/snapshot`, {
      method: "POST",
    });
  },
};

export const notificationsApi = {
  async getStatus(): Promise<NotificationStatusResponse> {
    return request<NotificationStatusResponse>("/api/notifications/status", {
      method: "GET",
    });
  },

  async sendTestTelegram(): Promise<TestTelegramResponse> {
    return request<TestTelegramResponse>("/api/notifications/test-telegram", {
      method: "POST",
    });
  },

  async sendCustomAlert(data: SendCustomAlertDto): Promise<SendCustomAlertResponse> {
    return request<SendCustomAlertResponse>("/api/notifications/custom", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const healthApi = {
  async checkHealth(): Promise<ApiResponse<SystemHealthData> | SystemHealthData> {
    return request<ApiResponse<SystemHealthData>>("/api/health", {
      method: "GET",
    });
  },
};
