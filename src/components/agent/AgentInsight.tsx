"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info, Shield, TrendingUp, Wallet } from "lucide-react";
import type { AgentInsight } from "@/types/agent";

interface AgentInsightProps {
  insight: AgentInsight;
}

export function AgentInsightCard({ insight }: AgentInsightProps) {
  const getSeverityBadge = () => {
    switch (insight.severity?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: <AlertCircle size={14} className="text-rose-400" />,
          label: "Critical",
        };
      case "WARNING":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <AlertTriangle size={14} className="text-amber-400" />,
          label: "Warning",
        };
      default:
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: <Info size={14} className="text-blue-400" />,
          label: "Notice",
        };
    }
  };

  const getTypeIcon = () => {
    switch (insight.type?.toUpperCase()) {
      case "SECURITY":
        return <Shield size={14} className="text-purple-400" />;
      case "PERFORMANCE":
        return <TrendingUp size={14} className="text-emerald-400" />;
      case "BALANCE":
        return <Wallet size={14} className="text-yellow-400" />;
      default:
        return <Info size={14} className="text-gray-400" />;
    }
  };

  const badge = getSeverityBadge();

  return (
    <div className="rounded-xl bg-[#141828] border border-[#20263c] p-3.5 flex flex-col gap-2 hover:border-[#2d3655] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {getTypeIcon()}
          <span className="font-medium text-[11px] uppercase tracking-wider">{insight.type}</span>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </div>

      <h4 className="text-xs font-semibold text-white">{insight.title}</h4>
      <p className="text-xs text-gray-300 leading-relaxed">{insight.description}</p>

      {insight.createdAt && (
        <span className="text-[10px] text-gray-500 self-end mt-1">
          {new Date(insight.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}

