"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  Coins,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";
import { useTreasury } from "@/hooks/useTreasury";
import { useWallet } from "@/hooks/useWallet";
import { TreasuryCard } from "@/components/treasury/TreasuryCard";
import { TreasuryBalance } from "@/components/treasury/TreasuryBalance";
import { TreasuryAllocation } from "@/components/treasury/TreasuryAllocation";
import { TreasuryHealth } from "@/components/treasury/TreasuryHealth";
import { CreateTreasuryModal } from "@/components/treasury/CreateTreasuryModal";
import { AddAssetModal } from "@/components/treasury/AddAssetModal";
import { DepositModal } from "@/components/treasury/DepositModal";

export default function TreasuryPage() {
  const { isAuthenticated, login, isConnecting } = useWallet();
  const {
    treasuries,
    selectedTreasury,
    overview,
    assets,
    isLoading,
    isSyncing,
    error,
    selectTreasury,
    createTreasury,
    syncBalances,
    refreshOverview,
  } = useTreasury();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Treasury Management
          </h2>
          <p className="text-sm text-gray-400">
            Smart multi-asset vaults on Aevum Testnet with autonomous AI agent guardrails in tUSD8.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDepositModalOpen(true)}
              disabled={!selectedTreasury}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
            >
              <ArrowDownLeft size={14} />
              <span>Deposit to Vault</span>
            </button>
            <button
              onClick={() => syncBalances()}
              disabled={isSyncing || !selectedTreasury}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 bg-[#141828] hover:bg-[#1e243d] border border-[#22283d] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Syncing..." : "Sync Vault"}</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20"
            >
              <Plus size={14} />
              <span>New Treasury</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
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
            Authenticate your EVM wallet to view, deploy, and manage your AI-driven smart treasuries on Aevum Testnet.
          </p>
          <button
            onClick={login}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in with Wallet...</span>
              </>
            ) : (
              <>
                <Wallet size={16} />
                <span>Connect Wallet to Begin</span>
              </>
            )}
          </button>
        </div>
      ) : isLoading && treasuries.length === 0 ? (
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 size={32} className="text-[#6366f1] animate-spin mb-3" />
          <p className="text-xs text-gray-400">Loading your treasuries...</p>
        </div>
      ) : treasuries.length === 0 ? (
        /* Empty State (Authenticated but no treasuries yet) */
        <div className="rounded-2xl border border-[#1e2335] bg-[#111423] p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4 border border-yellow-500/20">
            <Coins size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Treasury Vaults Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">
            Create your first intelligent treasury vault on Aevum Testnet. Your AI Agent will automatically track balances and manage reserves in tUSD8 and tQDAY.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-all shadow-lg shadow-[#3538cd]/20"
          >
            <Plus size={16} />
            <span>Create Your First Treasury</span>
          </button>
        </div>
      ) : (
        /* Main View with Treasuries */
        <div className="flex flex-col gap-6">
          {/* Treasury Vault Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Your Vaults ({treasuries.length})
              </h3>
              <span className="text-xs text-gray-500">
                Click any vault to inspect assets & metrics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treasuries.map((t) => (
                <TreasuryCard
                  key={t.id}
                  treasury={t}
                  isSelected={selectedTreasury?.id === t.id}
                  onSelect={() => selectTreasury(t)}
                />
              ))}
            </div>
          </div>

          {/* Active Treasury Detailed Workspace */}
          {selectedTreasury && (
            <div className="flex flex-col gap-6 pt-2">
              <div className="flex items-center justify-between border-b border-[#1e2335] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white">
                    {selectedTreasury.name} — Overview & Reserves
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Shield size={14} className="text-emerald-400" />
                  <span>Aevum Vault: {selectedTreasury.contractAddress.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Balances Grid */}
              <TreasuryBalance
                overview={overview}
                isSyncing={isSyncing}
                onSync={() => syncBalances(selectedTreasury.id)}
              />

              {/* Assets Allocation & Health Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TreasuryAllocation
                    assets={assets}
                    onAddAsset={() => setAddAssetModalOpen(true)}
                  />
                </div>
                <div>
                  <TreasuryHealth overview={overview} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTreasuryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (dto) => {
          await createTreasury(dto);
        }}
      />

      {selectedTreasury && (
        <>
          <AddAssetModal
            isOpen={addAssetModalOpen}
            treasuryId={selectedTreasury.id}
            onClose={() => setAddAssetModalOpen(false)}
            onSuccess={() => {
              void refreshOverview();
            }}
          />

          <DepositModal
            treasury={selectedTreasury}
            isOpen={depositModalOpen}
            onClose={() => setDepositModalOpen(false)}
            onSuccess={() => {
              void refreshOverview();
              void syncBalances();
            }}
          />
        </>
      )}
    </div>
  );
}
