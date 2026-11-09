"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/config/constants";
import { generateMockTxHash } from "@/lib/utils";
import type {
  AgentAllowance,
  AuditStreamItem,
  SetAgentConfigDto,
  SimulatedSpendResult,
} from "@/types/agent-allowance";

const DEFAULT_AGENTS: AgentAllowance[] = [
  {
    id: "agent-1",
    address: "0x71C63B72834b655513D02F249f3FdfFcbF8249A1",
    name: "DeepSeek Inference Agent",
    roleTag: "Inference Agent",
    dailyLimit: 1.0,
    spentToday: 0.10,
    maxSingleTxLimit: 0.25,
    enforceWhitelist: true,
    whitelistedRecipients: [
      "0x89205a3e3b2a69de6dbf7f01ed13b2108b2c43e7", // Together AI / Compute
      "0x2b8004f1a268fb4f15d74268e37602e1c981881f", // DeepSeek Inference Gateway
    ],
    lastResetTimestamp: 1731140000000,
    isActive: true,
    avatarBg: "from-blue-600 to-indigo-600",
  },
  {
    id: "agent-2",
    address: "0x94B8fDb234479e3e3b749668d29bFEf4E638823C",
    name: "Data Scraper & Indexer",
    roleTag: "Data Scraper Agent",
    dailyLimit: 0.5,
    spentToday: 0.42, // 84% -> Yellow Warning
    maxSingleTxLimit: 0.15,
    enforceWhitelist: true,
    whitelistedRecipients: [
      "0x91d5c21966a347391ab1a5f4bb59a3cb7c73db21", // Proxy Network
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // Web Scraping API
    ],
    lastResetTimestamp: 1731110000000,
    isActive: true,
    avatarBg: "from-amber-500 to-orange-600",
  },
  {
    id: "agent-3",
    address: "0x3F221c97a4A02A54019E2B7A845b4B8Cfe6211D9",
    name: "Cloud Compute Dispatcher",
    roleTag: "Compute Agent",
    dailyLimit: 1.0,
    spentToday: 0.95, // 95% -> Red Alert
    maxSingleTxLimit: 0.25,
    enforceWhitelist: false,
    whitelistedRecipients: [],
    lastResetTimestamp: 1731090000000,
    isActive: true,
    avatarBg: "from-purple-600 to-pink-600",
  },
];

const INITIAL_AUDIT_STREAM: AuditStreamItem[] = [
  {
    id: "tx-real-payment-1",
    timestamp: "2026-11-09T14:52:07.000Z",
    agentAddress: "0x13487df8c92df39e8f71f86fc2da9873dbbd68aa",
    agentName: "AevumAgentVault (Autonomous)",
    recipient: "0x89205A3E3b2a69de6DBf7F01eD13B2108b2C43e7",
    recipientName: "Compute / Inference Gateway",
    amount: 0.02,
    currency: "tUSD8",
    purpose: "GPU Compute Refill (Qwen-72B Stream)",
    txHash: "0xdd2440f6aa913b183ef249584d3174410da60371c678462441139ca97e8230d3",
    isAutonomous: true,
    type: "AI_SPEND",
    status: "CONFIRMED",
  },
];

export function useAgentAllowances() {
  const [agents, setAgents] = useState<AgentAllowance[]>(DEFAULT_AGENTS);
  const [auditStream, setAuditStream] = useState<AuditStreamItem[]>(INITIAL_AUDIT_STREAM);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const savedAgents = localStorage.getItem(STORAGE_KEYS.AGENT_ALLOWANCES);
      if (savedAgents) {
        const parsed = JSON.parse(savedAgents);
        // If saved agents had old high limits (> 5.0 tUSD8), re-baseline to the 1.00 tUSD8 faucet limit
        if (Array.isArray(parsed) && parsed.some((a) => a.dailyLimit > 5.0)) {
          setAgents(DEFAULT_AGENTS);
          localStorage.setItem(STORAGE_KEYS.AGENT_ALLOWANCES, JSON.stringify(DEFAULT_AGENTS));
        } else {
          setAgents(parsed);
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.AGENT_ALLOWANCES, JSON.stringify(DEFAULT_AGENTS));
      }

      const savedStream = localStorage.getItem(STORAGE_KEYS.SIMULATED_TRANSACTIONS);
      if (savedStream) {
        const parsedStream = JSON.parse(savedStream);
        if (
          Array.isArray(parsedStream) &&
          (parsedStream.some((s) => s.amount > 5.0) || parsedStream.some((s) => s.txHash?.startsWith("0x091c")))
        ) {
          const valid = parsedStream.filter((s) => !s.txHash?.startsWith("0x091c") && s.amount <= 5.0);
          const combined = valid.length > 0 ? valid : INITIAL_AUDIT_STREAM;
          setAuditStream(combined);
          localStorage.setItem(STORAGE_KEYS.SIMULATED_TRANSACTIONS, JSON.stringify(combined));
        } else {
          setAuditStream(parsedStream);
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.SIMULATED_TRANSACTIONS, JSON.stringify(INITIAL_AUDIT_STREAM));
      }
    } catch (e) {
      console.warn("Could not read agent allowances from storage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistAgents = (updated: AgentAllowance[]) => {
    setAgents(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.AGENT_ALLOWANCES, JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  };

  const persistAuditStream = (updated: AuditStreamItem[]) => {
    setAuditStream(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_TRANSACTIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  };

  const setAgentConfig = useCallback(
    (dto: SetAgentConfigDto) => {
      const existingIdx = agents.findIndex(
        (a) => a.address.toLowerCase() === dto.agentAddress.toLowerCase()
      );

      let updated: AgentAllowance[];
      if (existingIdx >= 0) {
        updated = [...agents];
        updated[existingIdx] = {
          ...updated[existingIdx],
          name: dto.name || updated[existingIdx].name,
          roleTag: dto.roleTag || updated[existingIdx].roleTag,
          dailyLimit: dto.dailyLimit,
          maxSingleTxLimit: dto.maxSingleTxLimit,
          enforceWhitelist: dto.enforceWhitelist,
          whitelistedRecipients: dto.whitelistedRecipients || updated[existingIdx].whitelistedRecipients,
        };
      } else {
        const newAgent: AgentAllowance = {
          id: `agent-${Date.now()}`,
          address: dto.agentAddress,
          name: dto.name || "Custom AI Agent",
          roleTag: dto.roleTag || "AI Agent",
          dailyLimit: dto.dailyLimit,
          spentToday: 0,
          maxSingleTxLimit: dto.maxSingleTxLimit,
          enforceWhitelist: dto.enforceWhitelist,
          whitelistedRecipients: dto.whitelistedRecipients || [],
          lastResetTimestamp: Date.now(),
          isActive: true,
          avatarBg: "from-teal-500 to-emerald-600",
        };
        updated = [newAgent, ...agents];
      }

      persistAgents(updated);
      return updated;
    },
    [agents]
  );

  const simulateAgentSpend = useCallback(
    (req: {
      agentAddress: string;
      recipientAddress?: string;
      amount: number;
      purpose?: string;
      forceBreach?: boolean;
      txHash?: string;
    }): SimulatedSpendResult => {
      const agent = agents.find(
        (a) => a.address.toLowerCase() === req.agentAddress.toLowerCase()
      );

      if (!agent) {
        throw new Error("Agent not registered in AevumAgentVault");
      }

      const recipient =
        req.recipientAddress ||
        agent.whitelistedRecipients[0] ||
        "0x2b8004f1a268fb4f15d74268e37602e1c981881f";
      const purpose = req.purpose || "Autonomous Compute Disbursal";
      const timestamp = new Date().toISOString();

      // Check Breaches
      if (req.forceBreach) {
        const reason = "DAILY_LIMIT_EXCEEDED";
        const errorMsg =
          "🛡️ Over-Budget Request Blocked by AevumAgentVault: Limit Exceeded.";
        return {
          success: false,
          errorMessage: errorMsg,
          reason,
          agent,
          amount: req.amount,
          timestamp,
        };
      }

      // 1. Single Tx Ceiling Check
      if (req.amount > agent.maxSingleTxLimit) {
        return {
          success: false,
          errorMessage: `🛡️ Over-Budget Request Blocked by AevumAgentVault: Single-Tx ceiling of $${agent.maxSingleTxLimit.toFixed(2)} tUSD8 exceeded.`,
          reason: "SINGLE_TX_CEILING_EXCEEDED",
          agent,
          amount: req.amount,
          timestamp,
        };
      }

      // 2. Daily Cap Check
      if (agent.spentToday + req.amount > agent.dailyLimit) {
        const remaining = Math.max(0, agent.dailyLimit - agent.spentToday);
        return {
          success: false,
          errorMessage: `🛡️ Over-Budget Request Blocked by AevumAgentVault: Limit Exceeded. Daily remaining is $${remaining.toFixed(2)} tUSD8.`,
          reason: "DAILY_LIMIT_EXCEEDED",
          agent,
          amount: req.amount,
          timestamp,
        };
      }

      // 3. Whitelist Check
      if (
        agent.enforceWhitelist &&
        agent.whitelistedRecipients.length > 0 &&
        !agent.whitelistedRecipients.some(
          (w) => w.toLowerCase() === recipient.toLowerCase()
        )
      ) {
        return {
          success: false,
          errorMessage: `🛡️ Recipient Blocked by AevumAgentVault: ${recipient.slice(0, 6)}... is not in the approved whitelist.`,
          reason: "WHITELIST_REJECTED",
          agent,
          amount: req.amount,
          timestamp,
        };
      }

      // Success Path!
      const isSimulated = !req.txHash;
      const txHash = req.txHash || generateMockTxHash();
      const updatedSpent = agent.spentToday + req.amount;

      const updatedAgents = agents.map((a) =>
        a.id === agent.id ? { ...a, spentToday: updatedSpent } : a
      );
      persistAgents(updatedAgents);

      const newAuditItem: AuditStreamItem = {
        id: `sim-${Date.now()}`,
        timestamp,
        agentAddress: agent.address,
        agentName: agent.name,
        recipient,
        recipientName: "GPU Compute Provider",
        amount: req.amount,
        currency: "tUSD8",
        purpose,
        txHash,
        isAutonomous: true,
        type: "AI_SPEND",
        status: "CONFIRMED",
      };

      persistAuditStream([newAuditItem, ...auditStream]);

      return {
        success: true,
        txHash,
        isSimulated,
        agent: { ...agent, spentToday: updatedSpent },
        amount: req.amount,
        timestamp,
      };
    },
    [agents, auditStream]
  );

  const resetAgentSpent = useCallback(
    (agentAddress: string) => {
      const updated = agents.map((a) =>
        a.address.toLowerCase() === agentAddress.toLowerCase()
          ? { ...a, spentToday: 0, lastResetTimestamp: Date.now() }
          : a
      );
      persistAgents(updated);
    },
    [agents]
  );

  return {
    agents,
    auditStream,
    isLoaded,
    setAgentConfig,
    simulateAgentSpend,
    resetAgentSpent,
  };
}

