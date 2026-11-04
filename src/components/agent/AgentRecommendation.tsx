"use client";

import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import type { AgentRecommendation } from "@/types/agent";

interface AgentRecommendationProps {
  recommendation: AgentRecommendation;
  onActionClick?: (rec: AgentRecommendation) => void;
}

export function AgentRecommendationCard({
  recommendation,
  onActionClick,
}: AgentRecommendationProps) {
  const getActionColor = () => {
    switch (recommendation.actionType?.toUpperCase()) {
      case "TRANSFER":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "DEPOSIT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REBALANCE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "RULE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="rounded-xl bg-[#141828] border border-[#20263c] p-3.5 flex flex-col gap-2.5 hover:border-[#2d3655] transition-all">
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getActionColor()}`}
        >
          {recommendation.actionType || "Action"}
        </span>

        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock size={11} />
          <span>{recommendation.status || "PENDING"}</span>
        </span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white">{recommendation.title}</h4>
        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
          {recommendation.description}
        </p>
      </div>

      {(recommendation.amount || recommendation.recipientAddress) && (
        <div className="p-2 rounded-lg bg-[#0e111a] border border-[#1b2133] text-[11px] flex flex-col gap-1 font-mono">
          {recommendation.amount && (
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-500">Amount:</span>
              <span className="text-white font-medium">
                {recommendation.amount} {recommendation.tokenSymbol || "BNB"}
              </span>
            </div>
          )}
          {recommendation.recipientAddress && (
            <div className="flex justify-between text-gray-300 truncate">
              <span className="text-gray-500">Recipient:</span>
              <span className="text-gray-300 truncate max-w-[170px]" title={recommendation.recipientAddress}>
                {recommendation.recipientAddress}
              </span>
            </div>
          )}
        </div>
      )}

      {onActionClick && (
        <button
          onClick={() => onActionClick(recommendation)}
          className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-colors shadow-sm"
        >
          <span>Review Action</span>
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

