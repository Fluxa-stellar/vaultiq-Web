"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Gauge,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { useAgentAllowances } from "@/hooks/useAgentAllowances";
import { useWallet } from "@/hooks/useWallet";
import { FuelGauge } from "@/components/allowances/FuelGauge";
import { ConfigureAgentModal } from "@/components/allowances/ConfigureAgentModal";
import { AgentSimulator } from "@/components/simulator/AgentSimulator";
import { formatAddress, formatCountdown } from "@/lib/formatters";
import { AEVUM_EXPLORER, DEFAULT_VAULT_ADDRESS } from "@/config/constants";
import type { AgentAllowance, SetAgentConfigDto } from "@/types/agent-allowance";

export default function AgentAllowancesPage() {
  const { isAevumNetwork, switchToAevum, isAuthenticated } = useWallet();
  const {
    agents,
    setAgentConfig,
    simulateAgentSpend,
    resetAgentSpent,
  } = useAgentAllowances();

  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentAllowance | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const selectedAgentForSim = agents[0]?.id || "";
  const [now, setNow] = useState(0);

  // Timer tick for rolling 24h countdown
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleEditAgent = (agent: AgentAllowance) => {
    setEditingAgent(agent);
    setConfigureModalOpen(true);
  };

  const handleAddNewAgent = () => {
    setEditingAgent(null);
    setConfigureModalOpen(true);
  };

  const handleSaveConfig = (dto: SetAgentConfigDto) => {
    setAgentConfig(dto);
  };

  const calculateResetTime = (lastReset: number) => {
    if (!now) return "24h 00m 00s";
    const rollingPeriod = 24 * 60 * 60 * 1000;
    const elapsed = now - lastReset;
    const remaining = Math.max(0, rollingPeriod - (elapsed % rollingPeriod));
    return formatCountdown(remaining);
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Banner / Network Prompt */}
      {!isAevumNetwork && isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">Switch to Aevum Testnet</p>
              <p className="text-xs text-gray-300">
                You are currently on another chain. Switch to Aevum Testnet (Chain ID 44005) to sync with AevumAgentVault.
              </p>
            </div>
          </div>
          <button
            onClick={switchToAevum}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md"
          >
            <span>Switch to Aevum (0xaba5)</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
              <Gauge size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                AI Agent Allowances & Boundaries
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  tUSD8 Controlled
                </span>
              </h2>
              <p className="text-sm text-gray-400">
                Smart contract (AevumAgentVault.sol) enforcing per-agent daily caps, single-tx ceilings, and recipient whitelists.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNewAgent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
          >
            <Plus size={16} />
            <span>Configure / Add Agent</span>
          </button>
        </div>
      </div>

      {/* Active Agents Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Active AI Agents</h3>
            <span className="text-xs text-gray-400">({agents.length} registered agents)</span>
          </div>
          <span className="text-xs text-gray-400">
            Vault Contract:{" "}
            <a
              href={`${AEVUM_EXPLORER}/address/${DEFAULT_VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:underline"
            >
              {formatAddress(DEFAULT_VAULT_ADDRESS, 4)}
            </a>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agents.map((agent) => {
            const pct = Math.min(100, Math.round((agent.spentToday / agent.dailyLimit) * 100));
            const isNearCap = pct >= 90;
            const isWarning = pct >= 70 && pct < 90;

            return (
              <div
                key={agent.id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-[#111425] border border-[#212842] hover:border-indigo-500/40 transition-all gap-5 shadow-lg group relative overflow-hidden"
              >
                {/* Header: Identity + Role Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${
                        agent.avatarBg || "from-blue-600 to-indigo-600"
                      } flex items-center justify-center text-white shadow-md`}
                    >
                      <Bot size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {agent.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {agent.roleTag}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditAgent(agent)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2038] transition-colors"
                    title="Configure Agent Config"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                {/* Agent Address */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0e1a] border border-[#1b2137]">
                  <span className="text-[11px] font-mono text-gray-300">
                    {formatAddress(agent.address, 6)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(agent.address)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      title="Copy Address"
                    >
                      {copiedAddress === agent.address ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <a
                      href={`${AEVUM_EXPLORER}/address/${agent.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      title="View on QDay Explorer"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* Fuel Gauge Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">Daily Allowance Fuel Gauge</span>
                    <span className="text-gray-400 font-mono">
                      ${agent.spentToday.toFixed(2)} / ${agent.dailyLimit.toFixed(2)} tUSD8
                    </span>
                  </div>
                  <FuelGauge
                    spent={agent.spentToday}
                    total={agent.dailyLimit}
                    currency="tUSD8"
                    showDetails={false}
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span
                      className={`font-semibold ${
                        isNearCap ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {pct}% Spent
                    </span>
                    <span>Remaining: ${(agent.dailyLimit - agent.spentToday).toFixed(2)} tUSD8</span>
                  </div>
                </div>

                {/* Boundaries & Timer Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1c2237] text-xs">
                  {/* Single-Tx Ceiling */}
                  <div className="p-2.5 rounded-xl bg-[#0d101f] border border-[#1c2237] flex flex-col">
                    <span className="text-[10px] text-gray-400">Single-Tx Ceiling</span>
                    <span className="text-xs font-mono font-bold text-white mt-0.5">
                      ${agent.maxSingleTxLimit.toFixed(2)} tUSD8
                    </span>
                  </div>

                  {/* Reset Countdown Timer */}
                  <div className="p-2.5 rounded-xl bg-[#0d101f] border border-[#1c2237] flex flex-col">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={11} className="text-indigo-400" />
                      <span>24h Reset In</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-300 mt-0.5" suppressHydrationWarning>
                      {calculateResetTime(agent.lastResetTimestamp)}
                    </span>
                  </div>
                </div>

                {/* Whitelist Badge & Reset Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Shield size={12} className={agent.enforceWhitelist ? "text-emerald-400" : "text-gray-500"} />
                    <span>
                      {agent.enforceWhitelist
                        ? `${agent.whitelistedRecipients.length} Whitelisted Endpoints`
                        : "No Whitelist Restriction"}
                    </span>
                  </div>

                  <button
                    onClick={() => resetAgentSpent(agent.address)}
                    className="text-[10px] text-gray-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    title="Simulate 24h rollover limit reset"
                  >
                    <RotateCcw size={11} />
                    <span>Simulate Reset</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Agent Simulator Widget Section */}
      <div className="mt-2">
        <AgentSimulator
          agents={agents}
          onSimulateSpend={simulateAgentSpend}
          selectedAgentId={selectedAgentForSim}
        />
      </div>

      {/* Configure / Add Agent Modal */}
      <ConfigureAgentModal
        isOpen={configureModalOpen}
        onClose={() => setConfigureModalOpen(false)}
        agent={editingAgent}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

