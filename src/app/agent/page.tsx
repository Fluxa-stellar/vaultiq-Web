"use client";

import React from "react";
import Link from "next/link";
import { Bot, Plus, ShieldCheck, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useAgent } from "@/hooks/useAgent";
import { AgentChat } from "@/components/agent/AgentChat";
import { AgentPanel } from "@/components/agent/AgentPanel";

export default function AgentPage() {
  const { isAuthenticated, login, isConnecting } = useWallet();
  const { treasuries, selectedTreasury, selectTreasury } = useTreasury();
  const {
    messages,
    insights,
    recommendations,
    isSending,
    isAnalyzing,
    sendMessage,
    runAnalysis,
  } = useAgent(selectedTreasury?.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3538cd]/20 text-[#6366f1] border border-[#3538cd]/30">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Treasury Agent
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Autonomous Guardrails Active
              </span>
            </h2>
            <p className="text-sm text-gray-400">
              Conversational command center with grounded real-time on-chain context.
            </p>
          </div>
        </div>

        {isAuthenticated && treasuries.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">
                Target Vault
              </label>
              <select
                value={selectedTreasury?.id || ""}
                onChange={(e) => {
                  const target = treasuries.find((t) => t.id === e.target.value);
                  if (target) selectTreasury(target);
                }}
                className="bg-[#141828] text-xs font-semibold text-white border border-[#232b45] rounded-xl px-3 py-2 outline-none focus:border-[#3538cd] cursor-pointer"
              >
                {treasuries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.contractAddress.slice(0, 6)}...)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Unauthenticated State */}
      {!isAuthenticated ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-4 rounded-2xl bg-[#3538cd]/10 text-[#6366f1] mb-4">
            <Bot size={44} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Web3 Wallet</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Authenticate your wallet to allow the AI Agent to inspect your on-chain vaults and propose actions.
          </p>
          <button
            onClick={login}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20 disabled:opacity-50"
          >
            <Wallet size={16} />
            <span>Connect Wallet to Chat</span>
          </button>
        </div>
      ) : treasuries.length === 0 ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
            <Bot size={44} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Create a Treasury First</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            The AI Agent requires a connected smart treasury vault to monitor balances, analyze risk, and execute commands.
          </p>
          <Link
            href="/treasury"
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20"
          >
            <Plus size={16} />
            <span>Create Treasury Vault</span>
          </Link>
        </div>
      ) : (
        /* Main Chat & Intelligence Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <AgentChat
              messages={messages}
              isSending={isSending}
              onSendMessage={sendMessage}
              treasuryName={selectedTreasury?.name}
            />
          </div>

          <div>
            <AgentPanel
              insights={insights}
              recommendations={recommendations}
              isAnalyzing={isAnalyzing}
              onRunAnalysis={runAnalysis}
            />
          </div>
        </div>
      )}
    </div>
  );
}
