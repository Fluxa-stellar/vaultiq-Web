"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useTreasury } from "@/hooks/useTreasury";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { ProposeTransactionModal } from "@/components/transactions/ProposeTransactionModal";
import { DepositModal } from "@/components/treasury/DepositModal";
import { AEVUM_EXPLORER } from "@/config/constants";

export default function TransactionsPage() {
  const { isAuthenticated, login, isConnecting } = useWallet();
  const { treasuries, selectedTreasury, selectTreasury, assets, syncBalances, refreshOverview } = useTreasury();
  const {
    transactions,
    onChainTransactions,
    pendingApprovals,
    isLoading,
    proposeTransaction,
    reload,
    error,
  } = useTransactions(selectedTreasury?.id, selectedTreasury?.contractAddress);

  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3538cd]/20 text-[#6366f1] border border-[#3538cd]/30">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Transactions</h2>
            <p className="text-sm text-gray-400">
              Audit ledger of treasury payments, automated rebalances, and receipts.
            </p>
          </div>
        </div>

        {isAuthenticated && treasuries.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Vault Selector */}
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
              onClick={() => setDepositModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
            >
              <ArrowDownLeft size={14} />
              <span>Deposit to Vault</span>
            </button>

            <button
              onClick={() => setProposeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
            >
              <Send size={14} />
              <span>Propose Transfer</span>
            </button>
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
            Authenticate to view confirmed transactions and propose on-chain payments.
          </p>
          <button
            onClick={login}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20 disabled:opacity-50"
          >
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </button>
        </div>
      ) : treasuries.length === 0 ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
            <ArrowRightLeft size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Treasury Found</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Create a smart treasury vault before recording or proposing transactions.
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
        /* Main Transactions Workspace */
        <div className="flex flex-col gap-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="text-xs text-gray-400 mb-2">Total Confirmed Transactions</div>
              <div className="text-3xl font-bold text-white mb-1">
                {onChainTransactions.length > 0 ? onChainTransactions.length : transactions.length}
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Live On-Chain Verified (Aevum L2)
              </p>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Pending Governance Approvals</span>
                  <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    Action Required
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {pendingApprovals.length}
                </div>
              </div>

              <Link
                href="/approvals"
                className="mt-2 text-xs font-semibold text-[#3538cd] hover:text-[#3538cd]/80 flex items-center gap-1 transition-colors"
              >
                <span>Go to Approvals Queue</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="text-xs text-gray-400 mb-2">Vault Smart Contract</div>
              <div className="text-sm font-mono font-semibold text-white truncate mb-2">
                {selectedTreasury?.contractAddress}
              </div>
              <a
                href={`${AEVUM_EXPLORER}/address/${selectedTreasury?.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#3538cd] hover:underline"
              >
                <span>View on QDay Explorer</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Transactions List */}
          <TransactionList
            transactions={transactions}
            onChainTransactions={onChainTransactions}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Modals */}
      <ProposeTransactionModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        assets={assets}
        onSubmit={async (dto) => {
          await proposeTransaction(dto);
        }}
      />

      <DepositModal
        treasury={selectedTreasury}
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          void reload();
          void syncBalances();
          void refreshOverview();
        }}
      />
    </div>
  );
}
