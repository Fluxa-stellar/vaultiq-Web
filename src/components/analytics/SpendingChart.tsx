"use client";

import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownLeft, ArrowUpRight, BarChart3, PieChart as PieIcon } from "lucide-react";
import type { TreasuryAnalyticsData } from "@/types/analytics";

interface SpendingChartProps {
  analytics: TreasuryAnalyticsData | null;
}

export function SpendingChart({ analytics }: SpendingChartProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "type">("monthly");

  if (!analytics) {
    return (
      <div className="rounded-xl bg-[#131620] p-6 border border-[#1e2335] flex flex-col items-center justify-center min-h-[300px]">
        <BarChart3 size={32} className="text-gray-500 mb-2" />
        <p className="text-sm font-medium text-gray-300">No flow data available</p>
        <p className="text-xs text-gray-500 mt-1">Analytics will generate once transactions occur</p>
      </div>
    );
  }

  // Monthly breakdown
  const monthlyEntries = Object.entries(analytics.monthlySpending || {});
  const monthlyData: { label: string; amount: number; color?: string }[] =
    monthlyEntries.length > 0
      ? monthlyEntries.map(([month, amount]) => ({
          label: month,
          amount: Number(amount) || 0,
        }))
      : [
          { label: "Inflow", amount: parseFloat(analytics.totalInflow || "0"), color: "#10b981" },
          { label: "Outflow", amount: parseFloat(analytics.totalOutflow || "0"), color: "#ef4444" },
        ];

  // Transaction type breakdown
  const typeEntries = Object.entries(analytics.typeCounts || {});
  const typeData = typeEntries.map(([type, count]) => ({
    label: type.replace("_", " "),
    count: Number(count) || 0,
  }));

  const inflowNum = parseFloat(analytics.totalInflow || "0");
  const outflowNum = parseFloat(analytics.totalOutflow || "0");
  const netNum = parseFloat(analytics.netFlow || "0");

  return (
    <div className="rounded-xl bg-[#131620] p-6 border border-[#1e2335] flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Cash Flow & Activity</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Breakdown of inflows, outflows, and operational spending patterns
          </p>
        </div>

        <div className="flex items-center bg-[#181d2d] rounded-lg p-1 border border-[#23293e]">
          <button
            onClick={() => setViewMode("monthly")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "monthly"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BarChart3 size={12} />
            <span>Flows</span>
          </button>
          <button
            onClick={() => setViewMode("type")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "type"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <PieIcon size={12} />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Mini Flow Highlights */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#181d2d] p-3 border border-[#22293e]">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ArrowDownLeft size={13} className="text-emerald-400" />
            <span>Total Inflow</span>
          </div>
          <p className="text-base font-bold text-emerald-400 mt-1">
            +${inflowNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
        </div>

        <div className="rounded-lg bg-[#181d2d] p-3 border border-[#22293e]">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ArrowUpRight size={13} className="text-rose-400" />
            <span>Total Outflow</span>
          </div>
          <p className="text-base font-bold text-rose-400 mt-1">
            -${outflowNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
        </div>

        <div className="rounded-lg bg-[#181d2d] p-3 border border-[#22293e]">
          <span className="text-xs text-gray-400">Net Flow</span>
          <p
            className={`text-base font-bold mt-1 ${
              netNum >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netNum >= 0 ? "+" : ""}${netNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-56 w-full">
        {viewMode === "monthly" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2538" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161b2c",
                  borderColor: "#28324e",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(val: unknown) => [
                  `$${Number(val || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}`,
                  "Amount",
                ]}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || (index % 2 === 0 ? "#10b981" : "#6366f1")}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={typeData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2538" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161b2c",
                  borderColor: "#28324e",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(val: unknown) => [`${val} transactions`, "Frequency"]}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

