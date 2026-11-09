"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useTransactions } from "@/hooks/useTransactions";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { ApprovalModal } from "@/components/approvals/ApprovalModal";
import { ProposeTransferModal } from "@/components/approvals/ProposeTransferModal";
import { AEVUM_EXPLORER, DEFAULT_VAULT_ADDRESS } from "@/config/constants";
import type { Approval } from "@/types/transaction";

export default function ApprovalsPage() {
  const { isAuthenticated, login, isConnecting, address, balance, stableBalance } = useWallet();
  const { treasuries, selectedTreasury, selectTreasury, overview } = useTreasury();
  const {
    pendingApprovals,
    approvedApprovals,
    completedApprovals,
    isProcessingAction,
    approveRequest,
    rejectRequest,
    executeRequest,
    proposeTransaction,
    reload,
    error,
  } = useTransactions(selectedTreasury?.id);

  const [executingApproval, setExecutingApproval] = useState<Approval | null>(null);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSeedSampleProposal = async () => {
    if (!selectedTreasury) return;
    try {
      await proposeTransaction({
        toAddress: "0x2b8004f1a268fb4f15d74268e37602e1c981881f", // DeepSeek Inference Gateway
        amount: "0.20",
        tokenSymbol: "tUSD8",
        tokenAddress: "0x456569838f1d43009A91ebA4263147Afd7233483",
        type: "TRANSFER",
        reason: "Autonomous Compute Refill & API Quota Top-Up",
      });
      setSuccessToast("Created sample transfer proposal (0.20 tUSD8) calibrated for faucet claim.");
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error("Failed to seed sample proposal:", err);
    }
  };

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
              Review, approve, and execute real on-chain transfers and autonomous agent guardrails on Aevum Testnet.
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
              onClick={() => setProposeModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
            >
              <Plus size={14} />
              <span>Propose Real Transfer</span>
            </button>
          </div>
        )}
      </div>

      {/* Connected Wallet Live Data Badge */}
      {address && (
        <div className="p-3.5 rounded-xl bg-[#141828] border border-[#22293e] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-400">Connected Wallet:</span>
            <a
              href={`${AEVUM_EXPLORER}/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono font-medium text-white hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
            >
              <span>{address.slice(0, 10)}...{address.slice(-8)}</span>
              <ExternalLink size={12} className="text-gray-400" />
            </a>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-300 flex-wrap">
            <span>Wallet tUSD8: <strong className="text-emerald-400 font-mono">{stableBalance || "0.00"} tUSD8</strong></span>
            <span>Vault tUSD8: <strong className="text-indigo-400 font-mono">{overview?.vaultBalance || "1.00"} tUSD8</strong></span>
            <span>Gas: <strong className="text-amber-400 font-mono">{balance || "0.00"} tQDAY</strong></span>
          </div>
        </div>
      )}

      {successToast && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

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
            Authenticate to review, propose, and execute real on-chain multi-sig requests for your smart vault.
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
              <p className="text-xs text-gray-500">Requires owner review &amp; signature</p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Approved &amp; Ready</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {approvedApprovals.length}
              </div>
              <p className="text-xs text-gray-500">Ready for real on-chain execution</p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Completed / Executed</span>
                <ShieldCheck size={14} className="text-[#6366f1]" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {completedApprovals.length}
              </div>
              <p className="text-xs text-gray-500">Confirmed on Aevum Testnet</p>
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
              <div className="rounded-2xl bg-[#111423] border border-[#1e2335] p-8 text-center flex flex-col items-center justify-center gap-3">
                <CheckCircle2 size={28} className="text-emerald-400" />
                <div>
                  <h4 className="text-sm font-semibold text-white">No Pending Approvals</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">
                    All governance items are up to date. You can propose a new real transfer calibrated for your 1.00 tUSD8 claim budget.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center">
                  <button
                    onClick={() => setProposeModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
                  >
                    <Plus size={14} />
                    <span>Propose Real Transfer</span>
                  </button>
                  <button
                    onClick={handleSeedSampleProposal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Create Test Proposal (0.20 tUSD8)</span>
                  </button>
                </div>
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
                  <span>Approved &amp; Ready for On-Chain Execution ({approvedApprovals.length})</span>
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

      {/* Execution Modal with Real On-Chain Transfer */}
      <ApprovalModal
        approval={executingApproval}
        isOpen={!!executingApproval}
        onClose={() => {
          setExecutingApproval(null);
          void reload();
        }}
        onExecute={executeRequest}
      />

      {/* Propose Real Transfer Modal */}
      <ProposeTransferModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        onPropose={proposeTransaction}
        onRealTransferExecuted={(txHash) => {
          setSuccessToast(`Real transfer executed and mined on-chain! Tx: ${txHash.slice(0, 10)}...`);
          void reload();
        }}
      />
    </div>
  );
}
