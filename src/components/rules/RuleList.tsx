"use client";

import React, { useState } from "react";
import { Loader2, Plus, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Rule } from "@/types/rule";
import { RuleCard } from "./RuleCard";

interface RuleListProps {
  rules: Rule[];
  isLoading: boolean;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateClick: () => void;
  onInitDefaults?: () => Promise<void>;
  isResetting?: boolean;
}

export function RuleList({
  rules,
  isLoading,
  onToggle,
  onDelete,
  onCreateClick,
  onInitDefaults,
  isResetting,
}: RuleListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filtered = rules.filter((rule) => {
    if (activeTab === "ACTIVE" && !rule.isActive) return false;
    if (activeTab === "INACTIVE" && rule.isActive) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = rule.name.toLowerCase().includes(q);
      const matchDesc = rule.description?.toLowerCase().includes(q);
      const matchType = rule.type.toLowerCase().includes(q);
      return matchName || matchDesc || matchType;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121625] border border-[#1e2335] w-fit">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "ALL"
                ? "bg-[#3538cd] text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Policies ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "ACTIVE"
                ? "bg-[#3538cd] text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Active ({rules.filter((r) => r.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "INACTIVE"
                ? "bg-[#3538cd] text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Disabled ({rules.filter((r) => !r.isActive).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search policies..."
            className="w-full rounded-xl bg-[#141828] border border-[#232a42] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Grid of Rules */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-400 rounded-xl bg-[#121625] border border-[#1e2335]">
          Loading rules and automation policies...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#111423] border border-[#1e2335]">
          <div className="p-3 rounded-xl bg-[#1e2335] text-gray-500 mb-3">
            <SlidersHorizontal size={28} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            {searchTerm ? "No Matching Rules Found" : "No Guardrail Rules Configured"}
          </h4>
          <p className="text-xs text-gray-400 max-w-sm mb-5 leading-relaxed">
            {searchTerm
              ? "Try adjusting your search keywords."
              : "Define automated spending limits, low liquidity alerts, and multi-sig guardrails to secure your smart vault."}
          </p>
          {!searchTerm && (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={onCreateClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
              >
                <Plus size={14} />
                <span>Create Custom Rule</span>
              </button>
              {onInitDefaults && (
                <button
                  onClick={onInitDefaults}
                  disabled={isResetting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>Load Testnet Presets (0.25 tUSD8)</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
