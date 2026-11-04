"use client";

import React from "react";
import { AlertCircle, CheckCircle2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { TreasuryOverview } from "@/types/treasury";

interface TreasuryHealthProps {
  overview: TreasuryOverview | null;
}

export function TreasuryHealth({ overview }: TreasuryHealthProps) {
  const pendingCount = overview?.pendingApprovalsCount || 0;
  const activeRulesCount = overview?.activeRulesCount || 0;

  return (
    <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Treasury Health & Guardrails</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium text-[10px]">
            <ShieldCheck size={14} /> Protected
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-white">98%</span>
          <span className="text-xs text-emerald-400 font-medium">Optimal</span>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          All autonomous agent parameters, spend limits, and multisig policies are operating within bounds.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#181c2b] text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <SlidersHorizontal size={14} className="text-[#6366f1]" />
              <span>Active Policy Rules</span>
            </div>
            <span className="font-semibold text-white">{activeRulesCount}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#181c2b] text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              {pendingCount > 0 ? (
                <AlertCircle size={14} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-400" />
              )}
              <span>Pending Approvals</span>
            </div>
            <span
              className={`font-semibold ${
                pendingCount > 0 ? "text-amber-400" : "text-gray-400"
              }`}
            >
              {pendingCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

