"use client";

import React, { useState } from "react";
import {
  Bell,
  Clock,
  Loader2,
  Lock,
  Shield,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Rule } from "@/types/rule";

interface RuleCardProps {
  rule: Rule;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RuleCard({ rule, onToggle, onDelete }: RuleCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggle(rule.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete rule "${rule.name}"?`)) {
      try {
        setIsDeleting(true);
        await onDelete(rule.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getTypeMeta = () => {
    switch (rule.type) {
      case "LARGE_TRANSACTION":
        return {
          icon: <Shield size={16} className="text-amber-400" />,
          label: "Large Transfer Guardrail",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "LOW_BALANCE":
        return {
          icon: <TrendingDown size={16} className="text-rose-400" />,
          label: "Low Balance Warning",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      case "EXCESS_BALANCE":
        return {
          icon: <TrendingUp size={16} className="text-blue-400" />,
          label: "Excess Reserve Rule",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "SCHEDULED_TRANSFER":
        return {
          icon: <Clock size={16} className="text-purple-400" />,
          label: "Scheduled Automation",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
      default:
        return {
          icon: <SlidersHorizontal size={16} className="text-gray-400" />,
          label: rule.type,
          bg: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        };
    }
  };

  const typeMeta = getTypeMeta();

  return (
    <div
      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
        rule.isActive
          ? "bg-[#141828] border-[#222942] hover:border-[#313b5e]"
          : "bg-[#111422]/60 border-[#1c2235] opacity-65"
      }`}
    >
      {/* Top: Type Badge & Active Toggle Switch */}
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${typeMeta.bg}`}
        >
          {typeMeta.icon}
          <span>{typeMeta.label}</span>
        </span>

        {/* Custom Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-400">
            {rule.isActive ? "Active" : "Disabled"}
          </span>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            aria-label={rule.isActive ? "Disable rule" : "Enable rule"}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              rule.isActive ? "bg-emerald-500" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                rule.isActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div>
        <h4 className="text-sm font-bold text-white mb-1">{rule.name}</h4>
        {rule.description && (
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {rule.description}
          </p>
        )}

        {/* Condition & Action Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#0f121e] border border-[#1b2133] flex flex-col gap-0.5">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">Condition</span>
            <span className="font-mono text-gray-200 text-[11px]">
              {rule.condition?.threshold ? (
                <>
                  Threshold: {rule.type === "LOW_BALANCE" ? "<" : ">"}{" "}
                  {rule.condition.threshold} {rule.condition.token || "tUSD8"}
                </>
              ) : (
                "Trigger on evaluation"
              )}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0f121e] border border-[#1b2133] flex flex-col gap-0.5">
            <span className="text-[10px] uppercase text-gray-500 font-semibold">Execution Mode</span>
            <span className="font-semibold text-emerald-400 text-[11px]">
              {rule.executionMode || "REQUIRE_APPROVAL"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {rule.action?.notify && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Bell size={12} /> Alerts Enabled
            </span>
          )}
          {rule.action?.createApproval && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <Lock size={12} /> Approvals Enforced
            </span>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-500 hover:text-rose-400 transition-colors p-1"
          title="Delete Rule"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

