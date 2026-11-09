"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, Coins, Loader2, Sparkles, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { WalletModal } from "./WalletModal";

export function WalletButton() {
  const {
    address,
    formattedAddress,
    chainName,
    isConnecting,
    isAuthenticated,
    isAevumNetwork,
    switchToAevum,
    balance,
    stableBalance,
    error,
    login,
  } = useWallet();

  const [modalOpen, setModalOpen] = useState(false);
  const [isSwitchingAevum, setIsSwitchingAevum] = useState(false);

  const handleConnect = async () => {
    try {
      await login();
    } catch {
      // Error is caught and surfaced via state in useWallet
    }
  };

  const handleSwitchToAevum = async () => {
    try {
      setIsSwitchingAevum(true);
      await switchToAevum();
    } catch (e) {
      console.warn("Switch to Aevum error:", e);
    } finally {
      setIsSwitchingAevum(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2.5">
        {/* Error notification banner if login fails */}
        {error && (
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg max-w-xs truncate"
            title={error}
          >
            <AlertCircle size={14} className="shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* 1-Click Switch to Aevum Testnet if not on Aevum */}
        {isAuthenticated && !isAevumNetwork && (
          <button
            onClick={handleSwitchToAevum}
            disabled={isSwitchingAevum}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all border border-indigo-400/30 animate-pulse"
            title="Switch to Aevum Testnet (Chain ID 44005)"
          >
            <Sparkles size={14} className="text-yellow-300" />
            <span>{isSwitchingAevum ? "Connecting..." : "Switch to Aevum"}</span>
          </button>
        )}

        {isAuthenticated && address ? (
          <div className="flex items-center gap-2">
            {/* Stablecoin Balance Badge (tUSD8 - 6 decimals) */}
            <div
              onClick={() => setModalOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Aevum Treasury Stablecoin Reserve (tUSD8, 6 decimals)"
            >
              <Coins size={14} className="text-emerald-400" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">tUSD8 Balance</span>
                <span className="text-xs font-mono font-bold text-white">${stableBalance || "0.00"}</span>
              </div>
            </div>

            {/* Network indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141828] border border-[#22283d] text-xs font-medium text-gray-300">
              <span className={`w-2 h-2 rounded-full ${isAevumNetwork ? "bg-indigo-400" : "bg-emerald-400"}`} />
              <span className="font-semibold text-white">{isAevumNetwork ? "Aevum Testnet" : chainName}</span>
              {balance && (
                <span className="text-gray-400 font-mono text-[11px]">({balance} {isAevumNetwork ? "tQDAY" : ""})</span>
              )}
            </div>

            {/* Wallet Address & Trigger */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#1a2035] hover:bg-[#222a45] border border-[#2b3554] px-3.5 py-2 text-sm font-medium text-white transition-all shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-semibold">{formattedAddress}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-xl bg-[#3538cd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3538cd]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Wallet size={16} />
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        )}
      </div>

      <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

