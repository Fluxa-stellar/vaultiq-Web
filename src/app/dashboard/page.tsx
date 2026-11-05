"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ArrowRight,
  PlayCircle,
  Send,
  CheckCircle2,
  Wallet,
  RefreshCw,
  Plus,
  Loader2,
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

const performanceData = [
  { name: "May 08", value: 12000 },
  { name: "May 09", value: 14000 },
  { name: "May 10", value: 13500 },
  { name: "May 11", value: 15230.45 },
  { name: "May 12", value: 14800 },
  { name: "May 13", value: 16000 },
  { name: "May 14", value: 17432.82 },
];

const DEFAULT_ALLOCATION = [
  { name: "BNB", value: 1860, color: "#d29922" },
  { name: "USDT", value: 10500, color: "#2ea043" },
  { name: "USDC", value: 3980, color: "#3538cd" },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, formattedAddress } = useWallet();
  const {
    treasuries,
    selectedTreasury,
    overview,
    assets,
    isSyncing,
    syncBalances,
  } = useTreasury();

  const {
    insights,
    recommendations,
    sendMessage,
    isSending,
  } = useAgent(selectedTreasury?.id);

  const [agentInput, setAgentInput] = useState("");

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

  // Calculate live total value or default to display
  const liveTotalValue = assets.reduce((acc, curr) => {
    const val = parseFloat(curr.valueUsd || "0");
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const displayValue =
    isAuthenticated && selectedTreasury
      ? `$${liveTotalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "$17,432.82";

  const chartAllocation =
    isAuthenticated && assets.length > 0
      ? assets.map((a, i) => {
          const colors = ["#d29922", "#2ea043", "#3538cd", "#8b5cf6", "#ec4899"];
          const num = parseFloat(a.balance || "0");
          return {
            name: a.symbol || a.name,
            value: num > 0 ? num : 1,
            color: colors[i % colors.length],
            displayVal: `${num.toFixed(4)} ${a.symbol}`,
          };
        })
      : DEFAULT_ALLOCATION;

  const topInsight = insights[0];
  const topRecommendation = recommendations[0];

  return (
    <div className="flex flex-col gap-6">
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
                Connect your EVM wallet to load your smart vaults, execute transfers, and receive AI recommendations.
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
                You haven&apos;t created or linked a smart treasury vault yet on BNB Chain.
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
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                Total Treasury Value <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{displayValue}</div>
              <div className="text-xs font-medium text-green-500 flex items-center">
                +5.42% <span className="text-gray-500 ml-1">vs last 7 days</span>
              </div>
              <div className="h-10 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2ea043"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                24H Net Change <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">+$842.35</div>
              <div className="text-xs font-medium text-green-500 mb-2">+3.49%</div>
              <div className="flex items-end gap-1 h-10 mt-2">
                {[4, 7, 3, 8, 5, 10, 6].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500/80 rounded-sm"
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] relative overflow-hidden">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                Active Rules <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {overview?.activeRulesCount ?? 6}
              </div>
              <div className="text-xs font-medium text-green-500">Autonomous Guardrails Active</div>
              <div className="absolute right-4 bottom-4 text-[#3538cd]/20">
                <ShieldCheck size={64} />
              </div>
            </div>
          </div>

          {/* Row 2: Allocation & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="text-base font-medium text-white mb-4">Treasury Allocation</div>
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
                        <span className="text-gray-300">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium">
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
                {[
                  {
                    type: "Received",
                    amount: "+1,200 USDT",
                    from: "0x3bA...d91F",
                    time: "2m ago",
                    isPositive: true,
                  },
                  {
                    type: "Sent",
                    amount: "-500 USDT",
                    from: "To 0x7f2...a8E1",
                    time: "15m ago",
                    isPositive: false,
                  },
                  {
                    type: "Received",
                    amount: "+0.75 BNB",
                    from: "From 0x91c...9a8B",
                    time: "1h ago",
                    isPositive: true,
                  },
                  {
                    type: "Sent",
                    amount: "-2,000 USDT",
                    from: "To 0x1d3...b22F",
                    time: "3h ago",
                    isPositive: false,
                  },
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          act.isPositive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {act.isPositive ? (
                          <ArrowDownRight size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{act.type}</div>
                        <div className="text-xs text-gray-400">{act.from}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          act.isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {act.amount}
                      </div>
                      <div className="text-xs text-gray-400">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="text-base font-medium text-white">Tracked Assets</div>
                <Link
                  href="/treasury"
                  className="text-xs text-[#3538cd] hover:underline"
                >
                  View details
                </Link>
              </div>
              <div className="space-y-4">
                {(assets.length > 0 ? assets : [
                  { symbol: "BNB", name: "BNB Native Token", balance: "0", priceUsd: "0" },
                  { symbol: "USDT", name: "Tether USD", balance: "0", priceUsd: "1" },
                ]).map((asset, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-xs">
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{asset.symbol}</div>
                        <div className="text-xs text-gray-400">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {parseFloat(asset.balance || "0").toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{" "}
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-gray-400">
                        ${parseFloat(asset.priceUsd || "0").toFixed(2)} USD
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
                    : "Your treasury vault on BNB Chain is active and monitored 24/7. Smart contract guardrails are enabled."}
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
