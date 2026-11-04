"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Camera, Sparkles } from "lucide-react";
import type { TreasurySnapshot } from "@/types/analytics";

interface TreasuryChartProps {
  snapshots: TreasurySnapshot[];
  onCaptureSnapshot?: () => void;
  isSnapshotting?: boolean;
}

export function TreasuryChart({
  snapshots,
  onCaptureSnapshot,
  isSnapshotting,
}: TreasuryChartProps) {
  const [metric, setMetric] = useState<"total" | "bnb" | "stables">("total");

  // Format data for chart
  const formattedData = snapshots.map((s, index) => {
    const total = parseFloat(s.totalValueUsd || "0");
    const bnb = parseFloat(s.bnbValueUsd || "0");
    const usdt = parseFloat(s.usdtValueUsd || "0");
    const usdc = parseFloat(s.usdcValueUsd || "0");
    const stables = usdt + usdc;

    const date = new Date(s.createdAt);
    const label = !isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : `#${index + 1}`;
    const fullTime = !isNaN(date.getTime()) ? date.toLocaleString() : `Point ${index + 1}`;

    return {
      id: s.id,
      label,
      fullTime,
      total,
      bnb,
      stables,
    };
  });

  return (
    <div className="rounded-xl bg-[#131620] p-6 border border-[#1e2335] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Historical Valuation</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tracking on-chain balance snapshots and portfolio growth over time
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#181d2d] rounded-lg p-1 border border-[#23293e]">
            <button
              onClick={() => setMetric("total")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                metric === "total"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Total USD
            </button>
            <button
              onClick={() => setMetric("bnb")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                metric === "bnb"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              BNB
            </button>
            <button
              onClick={() => setMetric("stables")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                metric === "stables"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Stables
            </button>
          </div>

          {onCaptureSnapshot && (
            <button
              onClick={onCaptureSnapshot}
              disabled={isSnapshotting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2338] hover:bg-[#272e48] border border-[#2e3752] text-xs font-medium text-gray-200 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Camera size={13} className="text-indigo-400" />
              <span>{isSnapshotting ? "Saving..." : "Take Snapshot"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                  metric === "total" ? "Total Value" : metric === "bnb" ? "BNB Value" : "Stables Value",
                ]}
                labelFormatter={(_label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullTime;
                  }
                  return _label;
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1f2538] rounded-lg">
            <Sparkles size={28} className="text-indigo-400 mb-2" />
            <p className="text-sm font-medium text-gray-300">No snapshots recorded yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Capture your first balance snapshot to begin charting historical treasury value curves and performance.
            </p>
            {onCaptureSnapshot && (
              <button
                onClick={onCaptureSnapshot}
                disabled={isSnapshotting}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors"
              >
                <Camera size={14} />
                <span>{isSnapshotting ? "Capturing..." : "Capture Initial Snapshot"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

