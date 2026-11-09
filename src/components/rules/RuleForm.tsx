"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2, Plus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { CreateRuleDto, ExecutionMode, RuleType } from "@/types/rule";

interface RuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateRuleDto) => Promise<unknown>;
}

export const TEMPLATES = [
  {
    name: "Large Transfer Guardrail",
    description: "Require multisig approval for transfers exceeding 0.25 tUSD8",
    type: "LARGE_TRANSACTION" as RuleType,
    threshold: "0.25",
    token: "tUSD8",
    executionMode: "REQUIRE_APPROVAL" as ExecutionMode,
    notify: true,
    createApproval: true,
    badgeText: "> 0.25 tUSD8",
  },
  {
    name: "Low Vault Balance Warning",
    description: "Trigger security alert when vault drops below 0.50 tUSD8",
    type: "LOW_BALANCE" as RuleType,
    threshold: "0.50",
    token: "tUSD8",
    executionMode: "RECOMMEND" as ExecutionMode,
    notify: true,
    createApproval: false,
    badgeText: "< 0.50 tUSD8",
  },
  {
    name: "Excess Reserve Rebalance",
    description: "Suggest moving funds when reserves exceed 0.80 tUSD8",
    type: "EXCESS_BALANCE" as RuleType,
    threshold: "0.80",
    token: "tUSD8",
    executionMode: "RECOMMEND" as ExecutionMode,
    notify: true,
    createApproval: false,
    badgeText: "> 0.80 tUSD8",
  },
  {
    name: "Native Gas Station Alert",
    description: "Trigger alert when native tQDAY gas drops below 2.00 tQDAY",
    type: "LOW_BALANCE" as RuleType,
    threshold: "2.00",
    token: "tQDAY",
    executionMode: "RECOMMEND" as ExecutionMode,
    notify: true,
    createApproval: false,
    badgeText: "< 2.00 tQDAY",
  },
];

const PRESET_AMOUNTS = [
  { label: "0.05", val: "0.05", tok: "tUSD8" },
  { label: "0.10", val: "0.10", tok: "tUSD8" },
  { label: "0.20", val: "0.20", tok: "tUSD8" },
  { label: "0.25", val: "0.25", tok: "tUSD8" },
  { label: "0.50", val: "0.50", tok: "tUSD8" },
  { label: "0.80", val: "0.80", tok: "tUSD8" },
  { label: "1.00", val: "1.00", tok: "tUSD8" },
  { label: "2.00 tQDAY", val: "2.00", tok: "tQDAY" },
];

export function RuleForm({ isOpen, onClose, onSubmit }: RuleFormProps) {
  const [name, setName] = useState(TEMPLATES[0].name);
  const [description, setDescription] = useState(TEMPLATES[0].description);
  const [type, setType] = useState<RuleType>(TEMPLATES[0].type);
  const [threshold, setThreshold] = useState(TEMPLATES[0].threshold);
  const [token, setToken] = useState(TEMPLATES[0].token);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(TEMPLATES[0].executionMode);
  const [notify, setNotify] = useState(true);
  const [createApproval, setCreateApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setName(tmpl.name);
    setDescription(tmpl.description);
    setType(tmpl.type);
    setThreshold(tmpl.threshold);
    setToken(tmpl.token);
    setExecutionMode(tmpl.executionMode);
    setNotify(tmpl.notify);
    setCreateApproval(tmpl.createApproval);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Rule name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        condition: {
          threshold: threshold.trim() || "0",
          token,
        },
        action: {
          notify,
          createApproval,
        },
        executionMode,
        isActive: true,
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create rule";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#3538cd]/20 text-[#6366f1]">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Policy Guardrail</h3>
              <p className="text-xs text-gray-400">Configure automated rules for your Aevum treasury vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Faucet Testnet Guidance Banner */}
        <div className="p-3 rounded-xl bg-[#3538cd]/10 border border-[#3538cd]/20 text-xs text-[#a5b4fc] flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#818cf8] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-white">Aevum Testnet Faucet Claim Scaling</div>
            <div className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
              Preset amounts are optimized for your daily claim of <strong>1.00 tUSD8</strong> and <strong>5.00 tQDAY</strong> so all condition thresholds trigger realistically during testing.
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Quick Templates (Scaled for Testnet Claim)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                  name === tmpl.name && threshold === tmpl.threshold && token === tmpl.token
                    ? "bg-[#181d33] border-[#4338ca] shadow-sm shadow-[#4338ca]/30"
                    : "bg-[#141828] border-[#21273d] hover:border-[#3538cd]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-white truncate">{tmpl.name}</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#3538cd]/20 text-[#818cf8] shrink-0">
                    {tmpl.badgeText}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                  {tmpl.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Rule Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Large Transfer Guardrail, Low Balance Warning"
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Description <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose of this policy guardrail..."
              className="w-full resize-none rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Rule Condition Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RuleType)}
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
              >
                <option value="LARGE_TRANSACTION">Large Transaction (&gt;)</option>
                <option value="LOW_BALANCE">Low Balance (&lt;)</option>
                <option value="EXCESS_BALANCE">Excess Balance (&gt;)</option>
                <option value="SCHEDULED_TRANSFER">Scheduled Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Threshold Amount ({token})
              </label>
              <input
                type="number"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="0.25"
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">Quick Amounts:</span>
              {PRESET_AMOUNTS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setThreshold(chip.val);
                    setToken(chip.tok);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors border ${
                    threshold === chip.val && token === chip.tok
                      ? "bg-[#3538cd] text-white border-[#3538cd]"
                      : "bg-[#141828] text-gray-400 hover:text-white border-[#232a42] hover:border-gray-600"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Asset Token
              </label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
              >
                <option value="tUSD8">tUSD8 (Stablecoin - 6 dec)</option>
                <option value="tQDAY">tQDAY (Native Gas - 18 dec)</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Execution Mode
              </label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as ExecutionMode)}
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
              >
                <option value="REQUIRE_APPROVAL">Require Multisig Approval</option>
                <option value="RECOMMEND">Recommend via AI Agent</option>
                <option value="AUTOMATIC">Execute Automatically</option>
              </select>
            </div>
          </div>

          {/* Action Flags */}
          <div className="p-3.5 rounded-xl bg-[#141828] border border-[#232a42] flex flex-col gap-2.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-[#0f121e] text-[#3538cd] focus:ring-0"
              />
              <span className="text-gray-200">Send notifications &amp; agent alert when triggered</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createApproval}
                onChange={(e) => setCreateApproval(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-[#0f121e] text-[#3538cd] focus:ring-0"
              />
              <span className="text-gray-200">Automatically create an approval request for policy reviews</span>
            </label>
          </div>

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
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Policy...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create Guardrail</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
