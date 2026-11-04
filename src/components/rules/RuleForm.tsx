"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2, Plus, SlidersHorizontal, X } from "lucide-react";
import type { CreateRuleDto, ExecutionMode, RuleType } from "@/types/rule";

interface RuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateRuleDto) => Promise<unknown>;
}

const TEMPLATES = [
  {
    name: "Large Transfer Guardrail",
    description: "Require multisig approval for transfers exceeding 2 BNB",
    type: "LARGE_TRANSACTION" as RuleType,
    threshold: "2.0",
    token: "BNB",
    executionMode: "REQUIRE_APPROVAL" as ExecutionMode,
    notify: true,
    createApproval: true,
  },
  {
    name: "Low Balance Emergency Warning",
    description: "Trigger security alert when vault BNB drops below 0.25 BNB",
    type: "LOW_BALANCE" as RuleType,
    threshold: "0.25",
    token: "BNB",
    executionMode: "RECOMMEND" as ExecutionMode,
    notify: true,
    createApproval: false,
  },
  {
    name: "Excess Reserve Rebalance",
    description: "Suggest moving funds to cold storage when reserves exceed 15 BNB",
    type: "EXCESS_BALANCE" as RuleType,
    threshold: "15.0",
    token: "BNB",
    executionMode: "RECOMMEND" as ExecutionMode,
    notify: true,
    createApproval: false,
  },
];

export function RuleForm({ isOpen, onClose, onSubmit }: RuleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RuleType>("LARGE_TRANSACTION");
  const [threshold, setThreshold] = useState("2.0");
  const [token, setToken] = useState("BNB");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("REQUIRE_APPROVAL");
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
              <p className="text-xs text-gray-400">Configure automated rules for your smart treasury vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
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
            Quick Templates
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="p-2.5 rounded-xl bg-[#141828] border border-[#21273d] hover:border-[#3538cd] text-left transition-all text-xs"
              >
                <div className="font-semibold text-white truncate">{tmpl.name}</div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {tmpl.type === "LARGE_TRANSACTION" ? "> 2 BNB" : tmpl.type === "LOW_BALANCE" ? "< 0.25 BNB" : "> 15 BNB"}
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
              placeholder="e.g. Daily Transfer Limit, Low Reserve Alert"
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
                Threshold Amount
              </label>
              <input
                type="number"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="2.0"
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
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
                <option value="BNB">BNB (Native)</option>
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

