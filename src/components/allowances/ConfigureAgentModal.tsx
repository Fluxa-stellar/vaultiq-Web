"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";
import type { AgentAllowance, SetAgentConfigDto } from "@/types/agent-allowance";

interface ConfigureAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentAllowance | null;
  onSave: (dto: SetAgentConfigDto) => void;
}

export function ConfigureAgentModal({
  isOpen,
  onClose,
  agent,
  onSave,
}: ConfigureAgentModalProps) {
  const [address, setAddress] = useState(agent?.address || "");
  const [name, setName] = useState(agent?.name || "");
  const [roleTag, setRoleTag] = useState(agent?.roleTag || "Inference Agent");
  const [dailyLimit, setDailyLimit] = useState(agent ? agent.dailyLimit.toString() : "100.00");
  const [maxSingleTxLimit, setMaxSingleTxLimit] = useState(agent ? agent.maxSingleTxLimit.toString() : "25.00");
  const [enforceWhitelist, setEnforceWhitelist] = useState(agent ? agent.enforceWhitelist : true);
  const [whitelistText, setWhitelistText] = useState(
    agent?.whitelistedRecipients?.join("\n") || "0x2b8004f1a268fb4f15d74268e37602e1c981881f\n0x89205a3e3b2a69de6dbf7f01ed13b2108b2c43e7"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state if agent prop changes
  React.useEffect(() => {
    if (agent) {
      setAddress(agent.address);
      setName(agent.name);
      setRoleTag(agent.roleTag);
      setDailyLimit(agent.dailyLimit.toString());
      setMaxSingleTxLimit(agent.maxSingleTxLimit.toString());
      setEnforceWhitelist(agent.enforceWhitelist);
      setWhitelistText(agent.whitelistedRecipients.join("\n"));
    } else {
      setAddress("");
      setName("");
      setRoleTag("Inference Agent");
      setDailyLimit("100.00");
      setMaxSingleTxLimit("25.00");
      setEnforceWhitelist(true);
      setWhitelistText("0x2b8004f1a268fb4f15d74268e37602e1c981881f");
    }
  }, [agent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please provide an EVM wallet address for the AI agent");
      return;
    }
    const dLimit = parseFloat(dailyLimit);
    const mLimit = parseFloat(maxSingleTxLimit);

    if (isNaN(dLimit) || dLimit <= 0) {
      setError("Daily limit must be greater than 0");
      return;
    }
    if (isNaN(mLimit) || mLimit <= 0) {
      setError("Single transaction limit must be greater than 0");
      return;
    }
    if (mLimit > dLimit) {
      setError("Single transaction ceiling cannot exceed the total daily limit");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const whitelisted = whitelistText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      onSave({
        agentAddress: address.trim(),
        name: name.trim() || "Autonomous AI Agent",
        roleTag: roleTag.trim() || "Inference Agent",
        dailyLimit: dLimit,
        maxSingleTxLimit: mLimit,
        enforceWhitelist,
        whitelistedRecipients: whitelisted,
      });

      setSuccessMsg("Agent allowance successfully configured in AevumAgentVault!");
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(null);
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to configure agent");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {agent ? "Edit Agent Allowance" : "Configure / Add AI Agent"}
              </h3>
              <p className="text-xs text-gray-400">
                AevumAgentVault per-agent spending boundary in tUSD8
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Agent Identity */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Agent Identity / Human-Readable Tag <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. DeepSeek Inference Agent"
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
              <select
                value={roleTag}
                onChange={(e) => setRoleTag(e.target.value)}
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
              >
                <option value="Inference Agent">Inference Agent (LLM APIs)</option>
                <option value="Data Scraper Agent">Data Scraper Agent (Indexers)</option>
                <option value="Compute Agent">Compute Agent (GPU/Cloud)</option>
                <option value="Yield Optimizer">Yield Optimizer Agent</option>
                <option value="Arbitrage Monitor">Arbitrage Monitor</option>
              </select>
            </div>
          </div>

          {/* Agent Wallet Address */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Agent EVM Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full font-mono rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          {/* Limits: Daily Cap & Single-Tx Ceiling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Daily Spending Limit (tUSD8) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-gray-400">$</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="100.00"
                  className="w-full font-mono rounded-xl bg-[#141828] border border-[#232a42] pl-7 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd]"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Rolling 24h cap</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Max Single-Tx Ceiling (tUSD8) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-gray-400">$</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={maxSingleTxLimit}
                  onChange={(e) => setMaxSingleTxLimit(e.target.value)}
                  placeholder="25.00"
                  className="w-full font-mono rounded-xl bg-[#141828] border border-[#232a42] pl-7 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd]"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Per-payment hard ceiling</span>
            </div>
          </div>

          {/* Recipient Whitelist Toggle & List */}
          <div className="p-3.5 rounded-xl bg-[#131728] border border-[#212740] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Enforce Recipient Whitelist</span>
                <span className="text-[11px] text-gray-400">
                  Restrict agent to only pay verified compute/API endpoints
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceWhitelist}
                  onChange={(e) => setEnforceWhitelist(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3538cd]"></div>
              </label>
            </div>

            {enforceWhitelist && (
              <div>
                <label className="text-[11px] font-medium text-gray-300 block mb-1">
                  Approved Recipient Addresses (One per line)
                </label>
                <textarea
                  rows={2}
                  value={whitelistText}
                  onChange={(e) => setWhitelistText(e.target.value)}
                  placeholder="0x..."
                  className="w-full font-mono text-[11px] rounded-lg bg-[#0e111d] border border-[#232a42] p-2.5 text-gray-200 focus:outline-none focus:border-[#3538cd]"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#1e2335] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1a2035] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Configuring on Aevum...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Save setAgentConfig()</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

