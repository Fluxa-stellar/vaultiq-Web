"use client";

import React from "react";
import { Coins, Plus } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TreasuryAsset } from "@/types/treasury";

interface TreasuryAllocationProps {
  assets: TreasuryAsset[];
  onAddAsset?: () => void;
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1"];

export function TreasuryAllocation({ assets, onAddAsset }: TreasuryAllocationProps) {
  const chartData = assets.map((asset, index) => {
    const val = parseFloat(asset.valueUsd || "0");
    const numBal = parseFloat(asset.balance || "0");
    return {
      name: asset.symbol || asset.name || "Unknown",
      value: val > 0 ? val : (numBal > 0 ? numBal : 1),
      color: COLORS[index % COLORS.length],
      balance: asset.balance,
      symbol: asset.symbol,
    };
  });

  return (
    <div className="rounded-xl bg-[#131620] p-6 border border-[#1e2335] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Asset Allocation</h3>
        </div>
        {onAddAsset && (
          <button
            onClick={onAddAsset}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2.5 py-1.5 rounded-lg border border-[#2b3554] transition-colors"
          >
            <Plus size={12} />
            <span>Track Token</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Donut Chart */}
        <div className="h-44 w-full flex items-center justify-center">
          {assets.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-[#0e111a] border border-[#242b42] p-2 text-xs text-white shadow-xl">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-gray-400">Balance: {data.balance} {data.symbol}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-gray-500">No assets tracked yet</div>
          )}
        </div>

        {/* Assets List */}
        <div className="md:col-span-2 flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
          {assets.length === 0 ? (
            <p className="text-xs text-gray-400">No assets currently added to this vault.</p>
          ) : (
            assets.map((asset, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div
                  key={asset.id || index}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#181c2a] border border-[#21273b] hover:border-[#2d3652] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">
                        {asset.symbol}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-white">
                      {parseFloat(asset.balance || "0").toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}{" "}
                      {asset.symbol}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      ${parseFloat(asset.valueUsd || "0").toFixed(2)} USD
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

