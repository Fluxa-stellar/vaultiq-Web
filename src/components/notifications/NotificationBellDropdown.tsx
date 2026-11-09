"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Send,
  ShieldAlert,
  AlertTriangle,
  Info,
  Settings,
  X,
  RefreshCw,
} from "lucide-react";
import { useTreasury } from "@/hooks/useTreasury";
import { useAgent } from "@/hooks/useAgent";
import { useAgentAllowances } from "@/hooks/useAgentAllowances";
import {
  AEVUM_EXPLORER,
  TELEGRAM_BOT_URL,
  TELEGRAM_BOT_USERNAME,
} from "@/config/constants";
import type { AgentInsight } from "@/types/agent";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "SUCCESS" | "INFO";
  timestamp: string;
  txHash?: string;
}

const DEFAULT_ALERTS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "🛡️ AevumAgentVault Guardrails Active",
    description: "Smart contract limits enforcing rolling 24h daily caps and max single-tx ceilings on Aevum Testnet (0xaba5).",
    severity: "SUCCESS",
    timestamp: "Just now",
  },
  {
    id: "notif-2",
    title: "⚡ Aevum Testnet Live",
    description: "Connected to Chain ID 44005 with tUSD8 primary settlement (6 decimals) and tQDAY native gas.",
    severity: "INFO",
    timestamp: "5m ago",
  },
  {
    id: "notif-3",
    title: "📱 Telegram Channel Connected",
    description: `Dual-push delivery connected to ${TELEGRAM_BOT_USERNAME}. Real-time disbursement and containment alerts active.`,
    severity: "INFO",
    timestamp: "10m ago",
  },
];

export function NotificationBellDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { selectedTreasury, treasuries } = useTreasury();
  const activeTreasuryId = selectedTreasury?.id || treasuries[0]?.id;
  const { insights, isLoading: isInsightsLoading, reload } = useAgent(activeTreasuryId);
  const { auditStream, agents } = useAgentAllowances();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge real-time events:
  // 1. Backend insights (GET /api/agent/:treasuryId/insights)
  // 2. Real-time disbursement settlements from auditStream
  // 3. Smart contract containment blocks from auditStream
  // 4. Threshold warnings (80%+ quota used)
  const items: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Real-time disbursements & containment blocks from auditStream
    auditStream.forEach((item) => {
      const isBlocked = item.status === "REVERTED_BLOCKED";
      if (isBlocked) {
        list.push({
          id: `containment-${item.id}`,
          title: "🛡️ Security Containment: Blocked by AevumAgentVault",
          description: `Unauthorized spend of ${item.amount.toFixed(2)} ${item.currency} blocked by smart contract. Transaction exceeds daily spending limit.`,
          severity: "CRITICAL",
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          txHash: undefined,
        });
      } else {
        list.push({
          id: `disbursement-${item.id}`,
          title: `🤖 Agent Disbursement Settled: ${item.amount.toFixed(2)} ${item.currency}`,
          description: `${item.agentName} settled ${item.amount.toFixed(2)} ${item.currency} for ${item.purpose || "compute refill"} on Aevum Testnet.`,
          severity: "SUCCESS",
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          txHash: item.txHash,
        });
      }
    });

    // 2. Threshold warnings when 80%+ daily quota is reached
    agents.forEach((agent) => {
      const quotaRatio = agent.dailyLimit > 0 ? agent.spentToday / agent.dailyLimit : 0;
      if (quotaRatio >= 0.8) {
        list.push({
          id: `threshold-${agent.id}`,
          title: `⚠️ Budget Threshold Warning (${(quotaRatio * 100).toFixed(0)}% Quota Used)`,
          description: `${agent.name} has spent ${agent.spentToday.toFixed(2)} of its ${agent.dailyLimit.toFixed(2)} tUSD8 daily limit. Rolling 24-hour limit resets soon.`,
          severity: "WARNING",
          timestamp: "Active",
        });
      }
    });

    // 3. Backend persisted insights from GET /api/agent/:treasuryId/insights
    insights.forEach((ins: AgentInsight, idx: number) => {
      const meta = ins.metadata as Record<string, unknown> | undefined;
      const rawSev = (ins.severity?.toUpperCase() || "INFO") as "CRITICAL" | "WARNING" | "SUCCESS" | "INFO";
      list.push({
        id: ins.id || `insight-${idx}`,
        title: ins.title,
        description: ins.description,
        severity: rawSev,
        timestamp: ins.createdAt
          ? new Date(ins.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Recent",
        txHash: typeof meta?.txHash === "string" ? meta.txHash : undefined,
      });
    });

    // 4. Default fallback alerts if feed is short
    list.push(...DEFAULT_ALERTS);

    // Deduplicate by id
    return list.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }, [auditStream, agents, insights]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <ShieldAlert size={14} className="text-rose-400 shrink-0" />;
      case "WARNING":
        return <AlertTriangle size={14} className="text-amber-400 shrink-0" />;
      case "SUCCESS":
        return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
      default:
        return <Info size={14} className="text-sky-400 shrink-0" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      case "WARNING":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "SUCCESS":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-sky-500/10 text-sky-300 border-sky-500/30";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && reload) {
            void reload();
          }
        }}
        className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2035] transition-colors cursor-pointer"
        title="View Real-Time Notifications & Insights"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" aria-hidden="true" />

        {/* Unread Indicator Pulse */}
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
        </span>
      </button>

      {/* Floating Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#0f1222] border border-[#232b45] shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#14182b] to-[#111425] border-b border-[#20273d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Notifications &amp; Insights</h3>
                <p className="text-[10px] text-gray-400">
                  Real-time Aevum stream &amp; GET /api/agent/insights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => reload && void reload()}
                disabled={isInsightsLoading}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#1a2035] transition-colors"
                title="Refresh feed"
              >
                <RefreshCw size={13} className={isInsightsLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Telegram Status Banner */}
          <div className="px-4 py-2 bg-sky-500/10 border-b border-sky-500/20 flex items-center justify-between text-xs">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sky-300 hover:text-white font-medium"
            >
              <Send size={12} className="text-sky-400" />
              <span>{TELEGRAM_BOT_USERNAME}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </a>
            <span className="text-[10px] text-gray-400">Dual-Delivery Active</span>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1b2238] p-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 hover:bg-[#151a2d] rounded-xl transition-colors flex flex-col gap-1 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    {getSeverityIcon(item.severity)}
                    <span className="text-[11px] truncate max-w-[220px]">{item.title}</span>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${getSeverityBadgeClass(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed pl-5">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-500 pl-5 pt-0.5">
                  <span>{item.timestamp}</span>
                  {item.txHash && (
                    <a
                      href={`${AEVUM_EXPLORER}/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>QDay Explorer</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#111425] border-t border-[#1e2338] flex items-center justify-between text-xs">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white flex items-center gap-1.5 text-[11px] font-medium transition-colors"
            >
              <Settings size={12} />
              <span>Notification Settings</span>
            </Link>

            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
            >
              <span>Open Telegram Bot</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
