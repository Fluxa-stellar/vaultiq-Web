"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  PlayCircle,
  Send,
  CheckCircle2,
  Wallet,
  RefreshCw,
  Plus,
  Loader2,
  Gauge,
  Zap,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useAgent } from "@/hooks/useAgent";
import { useAgentAllowances } from "@/hooks/useAgentAllowances";
import { useTransactions } from "@/hooks/useTransactions";
import { FuelGauge } from "@/components/allowances/FuelGauge";
import { formatTimeAgo, formatAddress } from "@/lib/formatters";
import { AEVUM_EXPLORER } from "@/config/constants";

const performanceData = [
  { name: "Nov 01", value: 110000 },
  { name: "Nov 02", value: 114000 },
  { name: "Nov 03", value: 118500 },
  { name: "Nov 04", value: 121200 },
  { name: "Nov 05", value: 122800 },
  { name: "Nov 06", value: 123900 },
  { name: "Nov 07", value: 124500 },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, address, formattedAddress, isAevumNetwork, switchToAevum, balance, stableBalance } = useWallet();
  const { agents, auditStream } = useAgentAllowances();
  const {
    treasuries,
    selectedTreasury,
    overview,
    assets,
    isSyncing,
    syncBalances,
  } = useTreasury();

  const { transactions, onChainTransactions } = useTransactions(
    selectedTreasury?.id,
    selectedTreasury?.contractAddress
  );

  const {
    insights,
    recommendations,
    sendMessage,
    isSending,
  } = useAgent(selectedTreasury?.id);

  const [agentInput, setAgentInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    if (!selectedTreasury) {
      router.push("/agent");
      return;
    }

    const text = agentInput.trim();
    setAgentInput("");
    await sendMessage(text);
  };

  // Real on-chain treasury value calculation:
  // If backend treasury overview is present and non-zero, use it.
  // Otherwise, use the user's connected wallet balance (tUSD8 * $1.00 + tQDAY * $1.25).
  const numStable = stableBalance ? parseFloat(stableBalance.replace(/,/g, "")) : 0;
  const numNative = balance ? parseFloat(balance.replace(/,/g, "")) : 0;
  const walletTreasuryValue = numStable * 1.0 + numNative * 1.25;

  const overviewAssetSum = overview?.assets?.reduce(
    (sum, a) => sum + parseFloat(a.valueUsd || "0"),
    0
  );

  const displayValue = !isAuthenticated && !address
    ? "$0.00"
    : overviewAssetSum && overviewAssetSum > 0
    ? `$${overviewAssetSum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : `$${walletTreasuryValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  // Dynamic 24H Agent Outflow
  const totalAgentOutflow = agents.reduce((sum, a) => sum + (a.spentToday || 0), 0);
  const totalDailyCap = agents.reduce((sum, a) => sum + (a.dailyLimit || 0), 0);
  const outflowPercentage = totalDailyCap > 0 ? (totalAgentOutflow / totalDailyCap) * 100 : 0;
  const isOutflowHigh = outflowPercentage > 90;
  const isOutflowMedium = outflowPercentage > 70;

  const aevumAssets = assets.filter((a) => {
    const sym = (a.symbol || a.name || "").toUpperCase();
    return sym.includes("USD8") || sym.includes("QDAY") || sym.includes("AEVUM");
  });

  const trackedAssetsList =
    aevumAssets.length > 0
      ? aevumAssets
      : [
          {
            symbol: "tUSD8",
            name: "tUSD8 Stablecoin (6 dec)",
            balance: stableBalance || "0.00",
            priceUsd: "1.00",
          },
          {
            symbol: "tQDAY",
            name: "Aevum Native Gas Token",
            balance: balance || "0.0000",
            priceUsd: "1.25",
          },
        ];

  const chartAllocation = (() => {
    if (aevumAssets.length > 0) {
      return aevumAssets.map((a, i) => {
        const colors = ["#10b981", "#6366f1", "#8b5cf6", "#3b82f6"];
        const num = parseFloat(a.balance || "0");
        const isUsd8 = (a.symbol || a.name || "").toUpperCase().includes("USD8");
        const isQday = (a.symbol || a.name || "").toUpperCase().includes("QDAY");
        return {
          name: a.symbol || a.name,
          value: num > 0 ? num : 0.0001,
          color: isUsd8 ? "#10b981" : isQday ? "#6366f1" : colors[i % colors.length],
          displayVal: `${num.toFixed(4)} ${a.symbol}`,
        };
      });
    }

    const valUsd8 = numStable;
    const valQday = numNative * 1.25;

    if (valUsd8 === 0 && valQday === 0) {
      return [
        { name: "tUSD8", value: 1, color: "#10b981", displayVal: "0.00 tUSD8" },
        { name: "tQDAY", value: 0, color: "#6366f1", displayVal: "0.0000 tQDAY" },
      ];
    }

    return [
      {
        name: "tUSD8",
        value: valUsd8 > 0 ? valUsd8 : 0.0001,
        color: "#10b981",
        displayVal: `${valUsd8.toFixed(2)} tUSD8`,
      },
      {
        name: "tQDAY",
        value: valQday > 0 ? valQday : 0.0001,
        color: "#6366f1",
        displayVal: `${numNative.toFixed(4)} tQDAY`,
      },
    ];
  })();

  // Real unified recent activity
  const unifiedActivities = (() => {
    const list: {
      id: string;
      type: string;
      amount: string;
      from: string;
      time: string;
      timestamp: number;
      isPositive: boolean;
      isAgent: boolean;
      isBlocked?: boolean;
      txHash?: string;
    }[] = [];

    // 1. From real live on-chain transactions (Aevum Testnet: deposits, agent disbursements, incoming external funding)
    (onChainTransactions || []).forEach((tx) => {
      const isDeposit = tx.type === "VAULT_DEPOSIT";
      const isIncoming = tx.type === "EXTERNAL_FUNDING";
      const isAgent = tx.type === "AI_SPEND";
      list.push({
        id: tx.id,
        type: isDeposit
          ? "Vault Deposit"
          : isIncoming
          ? "External Funding"
          : isAgent
          ? "Autonomous Spend"
          : "Vault Withdrawal",
        amount: `${tx.isPositive ? "+" : "-"}${tx.amount.toFixed(2)} ${tx.currency}`,
        from: tx.purpose || `${tx.agentName} → ${tx.recipientName || "Recipient"}`,
        time: formatTimeAgo(tx.timestamp),
        timestamp: new Date(tx.timestamp).getTime(),
        isPositive: tx.isPositive,
        isAgent,
        isBlocked: tx.status === "REVERTED_BLOCKED",
        txHash: tx.txHash,
      });
    });

    // 2. From agent audit stream (recent session dispatches, omitting stale 0x091c mock if on-chain txs exist)
    auditStream.forEach((item) => {
      const isMockHash = item.txHash?.startsWith("0x091c");
      if (onChainTransactions && onChainTransactions.length > 0 && isMockHash) {
        return;
      }
      const isBlocked = item.status === "REVERTED_BLOCKED";
      list.push({
        id: item.id,
        type: isBlocked ? "Blocked Policy Attempt" : item.isAutonomous ? "Autonomous Spend" : "Manual Spend",
        amount: `${isBlocked ? "Blocked: " : "-"}${item.amount.toFixed(2)} ${item.currency}`,
        from: `${item.agentName}${item.purpose ? ` (${item.purpose})` : ""}`,
        time: formatTimeAgo(item.timestamp),
        timestamp: new Date(item.timestamp).getTime(),
        isPositive: false,
        isAgent: true,
        isBlocked,
        txHash: item.txHash,
      });
    });

    // 3. From real database transactions ledger (e.g. deposits & transfers)
    (transactions || []).forEach((tx) => {
      const isDeposit = tx.type === "DEPOSIT";
      const num = parseFloat(tx.amount || "0");
      list.push({
        id: tx.id,
        type: tx.type === "DEPOSIT" ? "Vault Deposit" : tx.type === "TRANSFER" ? "Treasury Transfer" : tx.type === "WITHDRAW" ? "Withdrawal" : "Execution",
        amount: `${isDeposit ? "+" : "-"}${num.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tx.tokenSymbol || "tQDAY"}`,
        from: tx.reason || `${formatAddress(tx.fromAddress)} → ${formatAddress(tx.toAddress)}`,
        time: formatTimeAgo(tx.createdAt),
        timestamp: new Date(tx.createdAt).getTime(),
        isPositive: isDeposit,
        isAgent: tx.type === "CONTRACT_EXECUTION",
        isBlocked: tx.status === "FAILED" || tx.status === "REJECTED",
        txHash: tx.txHash || undefined,
      });
    });

    // Deduplicate by txHash or id, sort by newest first, take 5
    return list
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id || (t.txHash && t.txHash === v.txHash)) === i)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  })();

  const topInsight = insights[0];
  const topRecommendation = recommendations[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Aevum Switch Prompt Banner */}
      {isAuthenticated && !isAevumNetwork && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/40 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold flex items-center gap-2">
                Aevum Builder Challenge Network Switch
                <span className="text-[10px] bg-indigo-500/30 px-2 py-0.5 rounded font-mono text-indigo-200">
                  Chain ID 44005 (0xaba5)
                </span>
              </p>
              <p className="text-xs text-gray-300">
                Switch to Aevum Testnet to sync live with AevumAgentVault smart contract, disburse tUSD8, and inspect fuel gauges.
              </p>
            </div>
          </div>
          <button
            onClick={switchToAevum}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
          >
            <Sparkles size={14} className="text-yellow-300" />
            <span>Switch to Aevum Testnet</span>
          </button>
        </div>
      )}

      {/* Alert / Prompt banner if no treasury or unauthenticated */}
      {!isAuthenticated ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#3538cd]/10 border border-[#3538cd]/30 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3538cd] text-white">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Web3 Wallet Disconnected</p>
              <p className="text-xs text-gray-300">
                Connect your EVM wallet to load your smart vaults, execute transfers, and manage autonomous AI allowances.
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400">Click &quot;Connect Wallet&quot; in the header</span>
        </div>
      ) : treasuries.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">No Active Treasury Found</p>
              <p className="text-xs text-gray-300">
                You haven&apos;t created or linked a smart treasury vault yet on Aevum Testnet.
              </p>
            </div>
          </div>
          <Link
            href="/treasury"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3538cd] text-xs font-semibold text-white hover:bg-[#3538cd]/90 transition-colors"
          >
            <Plus size={14} />
            <span>Create Treasury</span>
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#131625] border border-[#20253a]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400">Active Vault:</span>
            <span className="text-sm font-semibold text-white">{selectedTreasury?.name}</span>
            <span className="text-[10px] font-mono text-gray-400 bg-[#1c2237] px-2 py-0.5 rounded">
              {selectedTreasury?.contractAddress.slice(0, 6)}...{selectedTreasury?.contractAddress.slice(-4)}
            </span>
          </div>
          <button
            onClick={() => syncBalances()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-3 py-1.5 rounded-lg border border-[#2b3554] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Vault"}</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1">Total Treasury Value <Info size={14} /></span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  tUSD8 (6 dec)
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{displayValue}</div>
              <div className="text-xs font-medium text-emerald-400 flex items-center justify-between">
                <span>+5.42% <span className="text-gray-500 ml-1">vs 7d</span></span>
                <span className="font-mono text-gray-400 text-[11px]">{balance ? `${balance} tQDAY gas` : "0.0000 tQDAY gas"}</span>
              </div>
              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1">24H Agent Outflow <Info size={14} /></span>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  Autonomous
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-2">-${totalAgentOutflow.toFixed(2)}</div>
              <div className={`text-xs font-medium mb-2 ${
                isOutflowHigh ? "text-rose-400" : isOutflowMedium ? "text-amber-400" : "text-emerald-400"
              }`}>
                {outflowPercentage.toFixed(1)}% of Daily Cap • {isOutflowHigh ? "Action Required" : isOutflowMedium ? "High Spend" : "Healthy"}
              </div>
              <div className="flex items-end gap-1 h-10 mt-2">
                {[4, 7, 3, 8, 5, 10, 6].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-indigo-500/80 rounded-sm"
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1">Security Boundary <Info size={14} /></span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  AevumAgentVault
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {agents.length} AI Agents
              </div>
              <div className="text-xs font-medium text-emerald-400">Strict Allowances &amp; Caps Enforced</div>
              <div className="absolute right-4 bottom-4 text-indigo-500/15">
                <ShieldCheck size={64} />
              </div>
            </div>
          </div>

          {/* Row 2: Allocation & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-base font-medium text-white">Treasury Allocation</div>
                  <div className="text-[11px] text-gray-400">Aevum Testnet Network</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Aevum Testnet (0xaba5)
                </span>
              </div>
              <div className="flex items-center">
                <div className="h-32 w-32 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartAllocation}
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 ml-4 space-y-3">
                  {chartAllocation.map((asset) => (
                    <div key={asset.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <div className="flex flex-col">
                          <span className="text-gray-300 font-semibold text-xs">{asset.name}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">Aevum Testnet</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium text-xs font-mono">
                          {asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/treasury"
                className="mt-4 text-xs font-medium text-[#3538cd] flex items-center gap-1 hover:text-[#3538cd]/80 transition-colors"
              >
                Manage vault &amp; track tokens <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-medium text-white">Recent Activity</div>
                <Link
                  href="/transactions"
                  className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {unifiedActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-[#0e111d] border border-[#1d2337] gap-2">
                    <Bot size={24} className="text-gray-500" />
                    <p className="text-xs font-semibold text-gray-300">No activity recorded yet</p>
                    <p className="text-[11px] text-gray-500 max-w-xs">
                      Run a transaction simulator request on Allowances or deposit funds to populate this audit feed.
                    </p>
                    <Link
                      href="/allowances"
                      className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Open Simulator</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  unifiedActivities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center h-8 w-8 rounded-full ${
                            act.isPositive
                              ? "bg-green-500/10 text-green-500"
                              : act.isBlocked
                              ? "bg-rose-500/10 text-rose-400"
                              : act.isAgent
                              ? "bg-indigo-500/10 text-indigo-400"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {act.isPositive ? (
                            <ArrowDownRight size={16} />
                          ) : act.isBlocked ? (
                            <ShieldAlert size={15} />
                          ) : act.isAgent ? (
                            <Bot size={15} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-1.5">
                            <span>{act.type}</span>
                            {act.txHash && (
                              <a
                                href={`${AEVUM_EXPLORER}/tx/${act.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-indigo-400 transition-colors"
                                title="View on Aevum QDay Explorer"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-xs">{act.from}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium font-mono ${
                            act.isPositive
                              ? "text-green-500"
                              : act.isBlocked
                              ? "text-rose-400"
                              : "text-red-400"
                          }`}
                        >
                          {act.amount}
                        </div>
                        <div className="text-xs text-gray-400" suppressHydrationWarning>
                          {act.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Agent Allowances Fuel Gauges Preview */}
          <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-indigo-400" />
                <h3 className="text-base font-semibold text-white">
                  Active AI Agent Allowances (tUSD8 Fuel Gauges)
                </h3>
              </div>
              <Link
                href="/allowances"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>Simulator &amp; Allowances</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {agents.map((ag) => (
                <div key={ag.id} className="p-3.5 rounded-xl bg-[#0e111d] border border-[#1d2337] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{ag.name}</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
                      ${ag.maxSingleTxLimit.toFixed(0)} max/tx
                    </span>
                  </div>
                  <FuelGauge spent={ag.spentToday} total={ag.dailyLimit} currency="tUSD8" />
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Performance & Top Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-medium text-white">Treasury Performance</div>
                <select className="bg-[#1e2335] text-xs text-gray-300 rounded-md px-2 py-1 border-none outline-none">
                  <option>Last 7 Days</option>
                </select>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3538cd" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3538cd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e2335",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#3538cd" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3538cd"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3538cd",
                        strokeWidth: 2,
                        stroke: "#131620",
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-base font-medium text-white">Tracked Assets</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    Aevum Testnet
                  </span>
                </div>
                <Link
                  href="/treasury"
                  className="text-xs text-[#3538cd] hover:underline"
                >
                  View details
                </Link>
              </div>
              <div className="space-y-4">
                {trackedAssetsList.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-1.5">
                          <span>{asset.symbol}</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-sans">
                            Aevum L2
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white font-mono">
                        {parseFloat(asset.balance || "0").toLocaleString(undefined, {
                          minimumFractionDigits: asset.symbol === "tUSD8" ? 2 : 4,
                          maximumFractionDigits: 4,
                        })}{" "}
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-gray-400">
                        ${(parseFloat(asset.balance || "0") * parseFloat(asset.priceUsd || "1")).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Agent Assistant */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">AI Agent</div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div className="flex gap-3">
                <div className="shrink-0 text-xl">
                  <span role="img" aria-label="wave">
                    👋
                  </span>
                </div>
                <div className="text-sm text-gray-300 bg-[#1e2335] p-3 rounded-lg rounded-tl-none">
                  Hi {formattedAddress || "there"}! I&apos;m your VAULTIQ copilot.
                </div>
              </div>

              {/* Dynamic or Default Insight */}
              <div className="bg-[#1e2335] rounded-xl p-4 border border-[#2d3348]">
                <div className="flex items-center gap-2 text-purple-400 font-medium mb-2 text-sm">
                  <PlayCircle size={16} /> Insight
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  {topInsight
                    ? `${topInsight.title}: ${topInsight.description}`
                    : "Your treasury vault on Aevum Testnet is active and monitored 24/7. Smart contract guardrails are enabled."}
                </p>
                <div className="h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.slice(3)}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic or Default Recommendation */}
              <div className="bg-[#1e2335] rounded-xl p-4 border border-[#2d3348]">
                <div className="flex items-center gap-2 text-green-400 font-medium mb-2 text-sm">
                  <CheckCircle2 size={16} /> Recommendation
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  {topRecommendation
                    ? `${topRecommendation.title}: ${topRecommendation.description}`
                    : "Sync your vault reserves on-chain to refresh BEP-20 token balances and yield snapshots."}
                </p>
                <Link
                  href="/agent"
                  className="block text-center w-full bg-[#3538cd] hover:bg-[#3538cd]/90 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Open AI Workspace
                </Link>
              </div>
            </div>

            <form onSubmit={handleAgentSubmit} className="mt-4 relative">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                disabled={isSending}
                placeholder={isSending ? "AI is processing..." : "Ask AI or give command..."}
                className="w-full rounded-lg bg-[#1e2335] py-2.5 pl-4 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3538cd] transition-colors"
              />
              <button
                type="submit"
                disabled={isSending || !agentInput.trim()}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white disabled:opacity-40"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin text-[#6366f1]" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
