"use client";

import React from "react";
import { formatCurrency } from "@/lib/formatters";

interface FuelGaugeProps {
  spent: number;
  total: number;
  currency?: string;
  showDetails?: boolean;
}

export function FuelGauge({
  spent,
  total,
  currency = "tUSD8",
  showDetails = true,
}: FuelGaugeProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;

  // Color coding: Green (< 70%), Yellow (70-90%), Red (> 90%)
  const getColorClasses = (pct: number) => {
    if (pct < 70) {
      return {
        bar: "bg-emerald-500",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        glow: "shadow-emerald-500/20",
        text: "text-emerald-400",
        status: "Healthy",
      };
    }
    if (pct <= 90) {
      return {
        bar: "bg-amber-400",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        glow: "shadow-amber-500/20",
        text: "text-amber-400",
        status: "Warning",
      };
    }
    return {
      bar: "bg-rose-500",
      badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      glow: "shadow-rose-500/20",
      text: "text-rose-400",
      status: "Near Cap",
    };
  };

  const theme = getColorClasses(percentage);
  const remaining = Math.max(0, total - spent);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-semibold">
              {formatCurrency(spent, 2)}
            </span>
            <span className="text-gray-500 font-medium">/</span>
            <span className="text-gray-400 font-medium">
              {formatCurrency(total, 2)} {currency}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${theme.badgeBg}`}
          >
            {percentage}% Spent • {theme.status}
          </span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="h-2.5 w-full rounded-full bg-[#1c2238] overflow-hidden p-0.5 border border-[#27304f]/60 relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${theme.bar} shadow-sm ${theme.glow}`}
          style={{ width: `${Math.max(3, percentage)}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>Remaining: {formatCurrency(remaining, 2)} {currency}</span>
          <span>Rolling 24h</span>
        </div>
      )}
    </div>
  );
}

