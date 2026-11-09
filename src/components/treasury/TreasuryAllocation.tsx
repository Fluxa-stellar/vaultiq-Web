"use client";

import React, { useMemo } from "react";
import { Coins, Plus } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TreasuryAsset } from "@/types/treasury";
import { useWallet } from "@/hooks/useWallet";
import { TUSD8_TOKEN_ADDRESS } from "@/config/constants";

interface TreasuryAllocationProps {
  assets: TreasuryAsset[];
  onAddAsset?: () => void;
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

export function TreasuryAllocation({ assets, onAddAsset }: TreasuryAllocationProps) {
  const { balance, stableBalance } = useWallet();

  // Normalize assets for Aevum Testnet:
  // 1. Any legacy 'BNB' or 0x0 asset is mapped to 'tQDAY' (Aevum Native Gas Token)
  // 2. Ensure primary settlement token 'tUSD8' is present
  // 3. Ensure 'tQDAY' is present
  // 4. Stale/unrelated non-Aevum tokens are removed
  const effectiveAssets: TreasuryAsset[] = useMemo(() => {
    const list: TreasuryAsset[] = [];
    let hasUsd8 = false;
    let hasQday = false;

    const numStable = stableBalance ? parseFloat(stableBalance.replace(/,/g, "")) : 0;
    const numNative = balance ? parseFloat(balance.replace(/,/g, "")) : 0;

    (assets || []).forEach((asset) => {
      const sym = (asset.symbol || "").toUpperCase();
      const addr = (asset.tokenAddress || "").toLowerCase();

      // Normalize zero-address or legacy 'BNB' to Aevum's native gas token 'tQDAY'
      if (
        addr === "0x0000000000000000000000000000000000000000" ||
        sym === "BNB" ||
        sym === "TQDAY" ||
        addr === ""
      ) {
        hasQday = true;
        const bal = balance || asset.balance || "0.0000";
        const num = parseFloat(bal.replace(/,/g, "") || "0");
        list.push({
          ...asset,
          id: asset.id || "aevum-tqday",
          symbol: "tQDAY",
          name: "Aevum Native Gas Token",
          decimals: 18,
          balance: bal,
          priceUsd: "1.25",
          valueUsd: (num * 1.25).toFixed(2),
        });
      } else if (sym.includes("USD8") || addr === TUSD8_TOKEN_ADDRESS.toLowerCase()) {
        hasUsd8 = true;
        const bal = stableBalance || asset.balance || "0.00";
        const num = parseFloat(bal.replace(/,/g, "") || "0");
        list.push({
          ...asset,
          id: asset.id || "aevum-tusd8",
          symbol: "tUSD8",
          name: "tUSD8 Stablecoin (6 dec)",
          decimals: 6,
          balance: bal,
          priceUsd: "1.00",
          valueUsd: (num * 1.0).toFixed(2),
        });
      } else {
        // Other tracked tokens on Aevum Testnet
        list.push(asset);
      }
    });

    // Ensure tUSD8 is ALWAYS present as the primary vault currency on Aevum
    if (!hasUsd8) {
      list.unshift({
        id: "aevum-tusd8",
        treasuryId: "",
        tokenAddress: TUSD8_TOKEN_ADDRESS,
        symbol: "tUSD8",
        name: "tUSD8 Stablecoin (6 dec)",
        decimals: 6,
        balance: stableBalance || "0.00",
        priceUsd: "1.00",
        valueUsd: (numStable * 1.0).toFixed(2),
      });
    }

    // Ensure tQDAY is ALWAYS present as the native gas reserve
    if (!hasQday) {
      list.push({
        id: "aevum-tqday",
        treasuryId: "",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        symbol: "tQDAY",
        name: "Aevum Native Gas Token",
        decimals: 18,
        balance: balance || "0.0000",
        priceUsd: "1.25",
        valueUsd: (numNative * 1.25).toFixed(2),
      });
    }

    // Strictly filter out any unmapped literal "BNB" entries
    return list.filter((a) => a.symbol !== "BNB");
  }, [assets, balance, stableBalance]);

  const chartData = effectiveAssets.map((asset, index) => {
    const val = parseFloat(asset.valueUsd || "0");
    const numBal = parseFloat(asset.balance || "0");
    const isUsd8 = (asset.symbol || "").toUpperCase().includes("USD8");
    const isQday = (asset.symbol || "").toUpperCase().includes("QDAY");
    const assetColor = isUsd8 ? "#10b981" : isQday ? "#6366f1" : COLORS[index % COLORS.length];

    return {
      name: asset.symbol || asset.name || "Unknown",
      value: val > 0 ? val : numBal > 0 ? numBal : 0.0001,
      color: assetColor,
      balance: asset.balance,
      symbol: asset.symbol,
    };
  });

  return (
    <div className="rounded-xl bg-[#131620] p-6 border border-[#1e2335] flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Asset Allocation</h3>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
            Aevum Testnet (0xaba5)
          </span>
        </div>
        {onAddAsset && (
          <button
            onClick={onAddAsset}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2.5 py-1.5 rounded-lg border border-[#2b3554] transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>Track Token</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Donut Chart */}
        <div className="h-44 w-full flex items-center justify-center">
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
                        <p className="text-gray-400 font-mono">
                          Balance: {parseFloat(data.balance || "0").toLocaleString(undefined, { maximumFractionDigits: 4 })} {data.symbol}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Assets List */}
        <div className="md:col-span-2 flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
          {effectiveAssets.map((asset, index) => {
            const isUsd8 = (asset.symbol || "").toUpperCase().includes("USD8");
            const isQday = (asset.symbol || "").toUpperCase().includes("QDAY");
            const color = isUsd8 ? "#10b981" : isQday ? "#6366f1" : COLORS[index % COLORS.length];

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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">
                        {asset.symbol}
                      </span>
                      {isUsd8 && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans">
                          Vault Native
                        </span>
                      )}
                      {isQday && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-sans">
                          Aevum Gas
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      {asset.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-medium text-white">
                    {parseFloat(asset.balance || "0").toLocaleString(undefined, {
                      minimumFractionDigits: isUsd8 ? 2 : 4,
                      maximumFractionDigits: 4,
                    })}{" "}
                    {asset.symbol}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    ${parseFloat(asset.valueUsd || "0").toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} USD
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
