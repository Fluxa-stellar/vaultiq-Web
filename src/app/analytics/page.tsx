"use client";

import React from "react";
import {
  BarChart2,
  Camera,
  Coins,
  History,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { useTreasury } from "@/hooks/useTreasury";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TreasuryChart } from "@/components/analytics/TreasuryChart";
import { SpendingChart } from "@/components/analytics/SpendingChart";
import { BSC_TESTNET_EXPLORER } from "@/config/constants";

export default function AnalyticsPage() {
  const { treasuries, selectedTreasury, selectTreasury, isLoading: isTreasuryLoading } = useTreasury();
  const {
    analytics,
    snapshots,
    isLoading: isAnalyticsLoading,
    isSnapshotting,
    captureSnapshot,
    reload,
  } = useAnalytics(selectedTreasury?.id);

  const totalInflow = parseFloat(analytics?.totalInflow || "0");
  const totalOutflow = parseFloat(analytics?.totalOutflow || "0");
  const netFlow = parseFloat(analytics?.netFlow || "0");
  const txCount = analytics?.transactionCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Treasury Analytics</h2>
            <p className="text-xs text-gray-400">
              On-chain balance snapshots, capital flows, and portfolio performance
            </p>
          </div>
        </div>

        {/* Controls: Treasury selector & actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {treasuries.length > 0 && (
            <div className="relative">
              <select
                value={selectedTreasury?.id || ""}
                onChange={(e) => selectTreasury(e.target.value)}
                className="appearance-none bg-[#141828] text-white text-xs font-medium pl-3 pr-8 py-2 rounded-lg border border-[#23293e] focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.assets?.length || 0} assets)
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          )}

          <button
            onClick={() => void reload()}
            disabled={isAnalyticsLoading || !selectedTreasury}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#141828] hover:bg-[#1a2035] border border-[#23293e] text-xs font-medium text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw size={13} className={isAnalyticsLoading ? "animate-spin text-indigo-400" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => void captureSnapshot()}
            disabled={isSnapshotting || !selectedTreasury}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Camera size={13} />
            <span>{isSnapshotting ? "Capturing..." : "Capture Snapshot"}</span>
          </button>
        </div>
      </div>

      {!selectedTreasury && !isTreasuryLoading ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center">
          <Wallet size={40} className="text-gray-500 mb-3" />
          <h3 className="text-base font-semibold text-white">No Treasury Selected</h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1">
            Create or select a treasury vault to inspect historical balance analytics and transaction flows.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#111423] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Total Inflow</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp size={14} />
                </div>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                +${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Cumulative deposits & receipts</p>
            </div>

            <div className="rounded-xl bg-[#111423] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Total Outflow</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <TrendingDown size={14} />
                </div>
              </div>
              <p className="text-xl font-bold text-rose-400">
                -${totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Withdrawals & executed transfers</p>
            </div>

            <div className="rounded-xl bg-[#111423] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Net Treasury Flow</span>
                <div
                  className={`p-1.5 rounded-lg ${
                    netFlow >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {netFlow >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
              </div>
              <p
                className={`text-xl font-bold ${
                  netFlow >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {netFlow >= 0 ? "+" : ""}${netFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Net capital balance expansion</p>
            </div>

            <div className="rounded-xl bg-[#111423] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Total Transactions</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <History size={14} />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{txCount}</p>
              <p className="text-[11px] text-gray-500 mt-1">Ledger operations recorded</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TreasuryChart
              snapshots={snapshots}
              onCaptureSnapshot={() => void captureSnapshot()}
              isSnapshotting={isSnapshotting}
            />
            <SpendingChart analytics={analytics} />
          </div>

          {/* Asset Allocation Breakdown */}
          {analytics?.assetAllocation && analytics.assetAllocation.length > 0 && (
            <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
              <div className="flex items-center gap-2 mb-4">
                <Coins size={18} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Tracked Token Distribution</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-400 border-b border-[#1e2335]">
                    <tr>
                      <th className="pb-3 font-medium">Asset</th>
                      <th className="pb-3 font-medium">Contract Address</th>
                      <th className="pb-3 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2335]/60">
                    {analytics.assetAllocation.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#151a2c] transition-colors">
                        <td className="py-3 font-medium text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                            {item.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <p>{item.name}</p>
                            <span className="text-[10px] text-gray-400">{item.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-gray-400">
                          {item.tokenAddress === "0x0000000000000000000000000000000000000000" ||
                          item.tokenAddress === "0x0" ? (
                            <span className="text-amber-400/90 font-sans font-medium">Native Token (BNB)</span>
                          ) : (
                            <a
                              href={`${BSC_TESTNET_EXPLORER}/address/${item.tokenAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors"
                            >
                              <span>
                                {item.tokenAddress.slice(0, 6)}...{item.tokenAddress.slice(-4)}
                              </span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                        <td className="py-3 text-right font-medium text-white">
                          {parseFloat(item.balance || "0").toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{" "}
                          <span className="text-gray-400">{item.symbol}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historical Snapshots Table */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Snapshot Log</h3>
              </div>
              <span className="text-xs text-gray-400">{snapshots.length} total captured</span>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                No balance snapshots captured yet. Click &quot;Capture Snapshot&quot; above to record one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-400 border-b border-[#1e2335]">
                    <tr>
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium text-right">BNB Value (USD)</th>
                      <th className="pb-3 font-medium text-right">USDT Value (USD)</th>
                      <th className="pb-3 font-medium text-right">USDC Value (USD)</th>
                      <th className="pb-3 font-medium text-right font-semibold text-white">Total USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2335]/60">
                    {[...snapshots].reverse().map((snap) => (
                      <tr key={snap.id} className="hover:bg-[#151a2c] transition-colors">
                        <td className="py-3 text-gray-300">
                          {new Date(snap.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          ${parseFloat(snap.bnbValueUsd || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          ${parseFloat(snap.usdtValueUsd || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          ${parseFloat(snap.usdcValueUsd || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-bold text-indigo-400">
                          ${parseFloat(snap.totalValueUsd || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
