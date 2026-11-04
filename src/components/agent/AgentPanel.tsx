"use client";

import React, { useState } from "react";
import { CheckCircle2, Lightbulb, Loader2, PlayCircle, ShieldAlert } from "lucide-react";
import type { AgentInsight, AgentRecommendation } from "@/types/agent";
import { AgentInsightCard } from "./AgentInsight";
import { AgentRecommendationCard } from "./AgentRecommendation";

interface AgentPanelProps {
  insights: AgentInsight[];
  recommendations: AgentRecommendation[];
  isAnalyzing: boolean;
  onRunAnalysis: () => Promise<void>;
}

export function AgentPanel({
  insights,
  recommendations,
  isAnalyzing,
  onRunAnalysis,
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "recommendations">("insights");

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-[#0f121e] border border-[#1e2335] shadow-xl overflow-hidden">
      {/* Header & Analysis Trigger */}
      <div className="p-4 border-b border-[#1e2335] bg-[#121626] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-400" />
            <h3 className="text-sm font-bold text-white">Agent Intelligence</h3>
          </div>
          <span className="text-[11px] text-gray-400">Autonomous Monitor</span>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#1c2238] hover:bg-[#252e4d] border border-[#2b3554] text-xs font-semibold text-white transition-all disabled:opacity-50 shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={14} className="animate-spin text-[#6366f1]" />
              <span>Scanning On-Chain Anomalies...</span>
            </>
          ) : (
            <>
              <PlayCircle size={14} className="text-[#6366f1]" />
              <span>Run Deep Treasury Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#1e2335] bg-[#101423]">
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "insights"
              ? "border-[#3538cd] text-white bg-[#151a2e]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <span>Insights</span>
          <span className="text-[10px] bg-[#1e243d] px-1.5 py-0.2 rounded-full text-gray-300">
            {insights.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "recommendations"
              ? "border-[#3538cd] text-white bg-[#151a2e]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <span>Actions</span>
          <span className="text-[10px] bg-[#1e243d] px-1.5 py-0.2 rounded-full text-gray-300">
            {recommendations.length}
          </span>
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {activeTab === "insights" ? (
          insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShieldAlert size={32} className="text-gray-600 mb-2" />
              <p className="text-xs font-medium text-gray-400">No active insights</p>
              <p className="text-[11px] text-gray-500 max-w-[200px] mt-1">
                Run deep analysis or chat with the agent to generate grounded insights.
              </p>
            </div>
          ) : (
            insights.map((ins, idx) => (
              <AgentInsightCard key={ins.id || idx} insight={ins} />
            ))
          )
        ) : (
          recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <CheckCircle2 size={32} className="text-gray-600 mb-2" />
              <p className="text-xs font-medium text-gray-400">No pending recommendations</p>
              <p className="text-[11px] text-gray-500 max-w-[200px] mt-1">
                Commands given in chat will formulate action recommendations here.
              </p>
            </div>
          ) : (
            recommendations.map((rec, idx) => (
              <AgentRecommendationCard key={rec.id || idx} recommendation={rec} />
            ))
          )
        )}
      </div>
    </div>
  );
}

