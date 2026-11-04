"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useTransactions } from "@/hooks/useTransactions";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { ApprovalModal } from "@/components/approvals/ApprovalModal";
import type { Approval } from "@/types/transaction";

export default function ApprovalsPage() {
  const { isAuthenticated, login, isConnecting } = useWallet();
  const { treasuries, selectedTreasury, selectTreasury } = useTreasury();
  const {
    pendingApprovals,
    approvedApprovals,
    completedApprovals,
    isProcessingAction,
    approveRequest,
    rejectRequest,
    executeRequest,
    error,
  } = useTransactions(selectedTreasury?.id);

  const [executingApproval, setExecutingApproval] = useState<Approval | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3538cd]/20 text-[#6366f1] border border-[#3538cd]/30">
            <CheckSquare size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Approvals &amp; Governance
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Multisig Policy Enforced
              </span>
            </h2>
            <p className="text-sm text-gray-400">
              Review, approve, and execute proposed treasury transfers and AI actions.
            </p>
          </div>
        </div>

        {isAuthenticated && treasuries.length > 0 && (
          <div className="flex items-center gap-3">
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
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
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
            Authenticate to review and approve pending multi-sig requests for your smart vault.
          </p>
          <button
            onClick={login}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20 disabled:opacity-50"
          >
            <Wallet size={16} />
            <span>Connect Wallet to Review</span>
          </button>
        </div>
      ) : treasuries.length === 0 ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
            <CheckSquare size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Treasury Found</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Create or select a smart treasury vault before reviewing governance approvals.
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
        /* Main Approvals Workspace */
        <div className="flex flex-col gap-6">
          {/* Quick Counter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Pending Approvals</span>
                <Clock size={14} className="text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-amber-400 mb-1">
                {pendingApprovals.length}
              </div>
              <p className="text-xs text-gray-500">Requires owner signature</p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Approved &amp; Ready</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {approvedApprovals.length}
              </div>
              <p className="text-xs text-gray-500">Ready for on-chain execution</p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Completed / Executed</span>
                <ShieldCheck size={14} className="text-[#6366f1]" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {completedApprovals.length}
              </div>
              <p className="text-xs text-gray-500">Historical actions</p>
            </div>
          </div>

          {/* Section 1: Pending Approvals */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Pending Review ({pendingApprovals.length})</span>
                {pendingApprovals.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </h3>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="rounded-xl bg-[#121625] border border-[#1e2335] p-8 text-center text-xs text-gray-400">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                <span>All clear! No pending approval requests requiring action.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    isProcessing={isProcessingAction}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    onExecute={(app) => setExecutingApproval(app)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Approved & Ready for On-Chain Execution */}
          {approvedApprovals.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Approved &amp; Ready for Execution ({approvedApprovals.length})</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    isProcessing={isProcessingAction}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    onExecute={(app) => setExecutingApproval(app)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Completed / Executed History */}
          {completedApprovals.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-[#1e2335]">
              <h3 className="text-sm font-bold text-gray-400">
                Action History ({completedApprovals.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedApprovals.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    isProcessing={isProcessingAction}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    onExecute={(app) => setExecutingApproval(app)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Execution Modal */}
      <ApprovalModal
        approval={executingApproval}
        isOpen={!!executingApproval}
        onClose={() => setExecutingApproval(null)}
        onExecute={executeRequest}
      />
    </div>
  );
}
