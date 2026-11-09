"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useRules } from "@/hooks/useRules";
import { RuleList } from "@/components/rules/RuleList";
import { RuleForm } from "@/components/rules/RuleForm";

export default function RulesPage() {
  const { isAuthenticated, login, isConnecting } = useWallet();
  const { treasuries, selectedTreasury, selectTreasury } = useTreasury();
  const {
    rules,
    activeRules,
    evalResults,
    isLoading,
    isEvaluating,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    evaluateRules,
    error,
  } = useRules(selectedTreasury?.id);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Detect rules that have legacy high thresholds (> 50.0) or legacy BNB token
  const legacyRules = rules.filter((r) => {
    const thresh = parseFloat(r.condition?.threshold || "0");
    const token = (r.condition?.token || "").toUpperCase();
    return thresh >= 50 || token === "BNB";
  });

  const handleResetToTestnetDefaults = async () => {
    if (!selectedTreasury) return;
    setIsResetting(true);
    setResetSuccessMsg(null);

    try {
      // 1. If legacy rules exist, scale them down to testnet claim amounts
      if (legacyRules.length > 0) {
        for (const rule of legacyRules) {
          if (rule.type === "LARGE_TRANSACTION") {
            await updateRule(rule.id, {
              name: "Large Transfer Guardrail",
              description: "Require multisig approval for transfers exceeding 0.25 tUSD8",
              condition: { threshold: "0.25", token: "tUSD8" },
            });
          } else if (rule.type === "LOW_BALANCE") {
            await updateRule(rule.id, {
              name: "Low Vault Balance Warning",
              description: "Trigger security alert when vault drops below 0.50 tUSD8",
              condition: { threshold: "0.50", token: "tUSD8" },
            });
          } else if (rule.type === "EXCESS_BALANCE") {
            await updateRule(rule.id, {
              name: "Excess Reserve Rebalance",
              description: "Suggest moving funds when reserves exceed 0.80 tUSD8",
              condition: { threshold: "0.80", token: "tUSD8" },
            });
          } else {
            await updateRule(rule.id, {
              condition: { threshold: "0.25", token: "tUSD8" },
            });
          }
        }
        setResetSuccessMsg("Updated existing policies to testnet faucet amounts (0.25 tUSD8, 0.50 tUSD8, 0.80 tUSD8).");
      } else if (rules.length === 0) {
        // 2. If no rules exist, create the standard 3 testnet guardrails
        await createRule({
          name: "Large Transfer Guardrail",
          description: "Require multisig approval for transfers exceeding 0.25 tUSD8",
          type: "LARGE_TRANSACTION",
          condition: { threshold: "0.25", token: "tUSD8" },
          action: { notify: true, createApproval: true },
          executionMode: "REQUIRE_APPROVAL",
          isActive: true,
        });
        await createRule({
          name: "Low Vault Balance Warning",
          description: "Trigger security alert when vault drops below 0.50 tUSD8",
          type: "LOW_BALANCE",
          condition: { threshold: "0.50", token: "tUSD8" },
          action: { notify: true, createApproval: false },
          executionMode: "RECOMMEND",
          isActive: true,
        });
        await createRule({
          name: "Excess Reserve Rebalance",
          description: "Suggest moving funds when reserves exceed 0.80 tUSD8",
          type: "EXCESS_BALANCE",
          condition: { threshold: "0.80", token: "tUSD8" },
          action: { notify: true, createApproval: false },
          executionMode: "RECOMMEND",
          isActive: true,
        });
        setResetSuccessMsg("Created testnet guardrails matching your 1.00 tUSD8 faucet claim budget.");
      } else {
        // If rules exist with reasonable amounts, refresh evaluation
        setResetSuccessMsg("All policies are already calibrated to Aevum testnet faucet amounts.");
      }

      // Re-evaluate immediately
      setTimeout(() => {
        void evaluateRules();
      }, 500);
    } catch (err: unknown) {
      console.error("Failed to reset rules to testnet defaults:", err);
    } finally {
      setIsResetting(false);
      setTimeout(() => setResetSuccessMsg(null), 6000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3538cd]/20 text-[#6366f1] border border-[#3538cd]/30">
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Rules &amp; Automation
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Autonomous Guardrails
              </span>
            </h2>
            <p className="text-sm text-gray-400">
              Spend ceilings, low balance alerts, and automated multi-sig triggers calibrated for Aevum testnet.
            </p>
          </div>
        </div>

        {isAuthenticated && treasuries.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedTreasury?.id || ""}
              onChange={(e) => {
                const target = treasuries.find((t) => t.id === e.target.value);
                if (target) selectTreasury(target);
              }}
              className="bg-[#141828] text-xs font-semibold text-white border border-[#232b45] rounded-xl px-3 py-2.5 outline-none focus:border-[#3538cd] cursor-pointer"
            >
              {treasuries.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.contractAddress.slice(0, 6)}...)
                </option>
              ))}
            </select>

            <button
              onClick={handleResetToTestnetDefaults}
              disabled={isResetting}
              title="Reset rule thresholds to match daily 1.00 tUSD8 claim"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} className={isResetting ? "animate-spin" : ""} />
              <span>{isResetting ? "Resetting..." : "Reset Claim Presets"}</span>
            </button>

            <button
              onClick={() => evaluateRules()}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-[#141828] hover:bg-[#1e243d] border border-[#22283d] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isEvaluating ? "animate-spin text-[#6366f1]" : ""} />
              <span>{isEvaluating ? "Evaluating..." : "Evaluate Policies"}</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
            >
              <Plus size={14} />
              <span>New Rule</span>
            </button>
          </div>
        )}
      </div>

      {resetSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{resetSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Legacy Threshold Warning Banner */}
      {legacyRules.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Legacy Mainnet Thresholds Detected:</span> {legacyRules.length} policy guardrail(s) have thresholds exceeding 50.0 tUSD8/BNB from prior templates.
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                Reset them now to calibrate against your daily <strong>1.00 tUSD8</strong> and <strong>5.00 tQDAY</strong> faucet claim for realistic testing.
              </div>
            </div>
          </div>
          <button
            onClick={handleResetToTestnetDefaults}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            {isResetting ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Reset All to 0.25 tUSD8</span>
          </button>
        </div>
      )}

      {/* Unauthenticated State */}
      {!isAuthenticated ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="p-4 rounded-2xl bg-[#3538cd]/10 text-[#6366f1] mb-4">
            <Wallet size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Connect Your Web3 Wallet</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Authenticate to configure autonomous guardrails and policy triggers for your treasury.
          </p>
          <button
            onClick={login}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20 disabled:opacity-50"
          >
            <Wallet size={16} />
            <span>Connect Wallet to Configure</span>
          </button>
        </div>
      ) : treasuries.length === 0 ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
            <SlidersHorizontal size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Treasury Found</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Create or select a smart treasury vault before setting up automation policies.
          </p>
          <Link
            href="/treasury"
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20"
          >
            <Plus size={16} />
            <span>Create Treasury</span>
          </Link>
        </div>
      ) : (
        /* Main Rules Workspace */
        <div className="flex flex-col gap-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Active Guardrails</span>
                <ShieldCheck size={14} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {activeRules.length} <span className="text-sm font-normal text-gray-500">/ {rules.length} total</span>
              </div>
              <p className="text-xs text-emerald-400">Monitoring Aevum Testnet state 24/7</p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Policy Evaluation</span>
                <PlayCircle size={14} className="text-[#6366f1]" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {evalResults ? `${evalResults.triggeredCount} Triggered` : "Verified"}
              </div>
              <p className="text-xs text-gray-400">
                {evalResults
                  ? `Evaluated ${evalResults.evaluatedCount} policies on current state`
                  : "Click 'Evaluate Policies' to scan state"}
              </p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Enforcement &amp; Faucet Claim</span>
                <Lock size={14} className="text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">1.00 tUSD8 / 5 tQDAY</div>
              <p className="text-xs text-gray-400">Thresholds calibrated for daily faucet test budget</p>
            </div>
          </div>

          {/* Evaluation Results Live Banner */}
          {evalResults && (
            <div className="p-4 rounded-2xl bg-[#131625] border border-[#212842] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {evalResults.triggeredCount > 0 ? (
                    <AlertTriangle size={18} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  )}
                  <h4 className="text-sm font-bold text-white">
                    Policy Evaluation Summary ({evalResults.evaluatedCount} evaluated)
                  </h4>
                </div>
                <span className="text-xs text-gray-400">
                  {evalResults.triggeredCount === 0 ? "All policies passed" : `${evalResults.triggeredCount} condition(s) active`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {evalResults.results.map((res) => (
                  <div
                    key={res.ruleId}
                    className="p-2.5 rounded-xl bg-[#0f121e] border border-[#1a2033] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-white truncate max-w-[180px]">
                      {res.ruleName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        res.triggered
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {res.triggered ? "Triggered" : "Clear"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules List */}
          <RuleList
            rules={rules}
            isLoading={isLoading}
            onToggle={toggleRule}
            onDelete={deleteRule}
            onCreateClick={() => setCreateModalOpen(true)}
            onInitDefaults={handleResetToTestnetDefaults}
            isResetting={isResetting}
          />
        </div>
      )}

      {/* Create Rule Modal */}
      <RuleForm
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (dto) => {
          await createRule(dto);
        }}
      />
    </div>
  );
}
