"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { WalletModal } from "./WalletModal";

export function WalletButton() {
  const {
    address,
    formattedAddress,
    chainName,
    isConnecting,
    isAuthenticated,
    error,
    login,
  } = useWallet();

  const [modalOpen, setModalOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await login();
    } catch {
      // Error is caught and surfaced via state in useWallet
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2">
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

        {isAuthenticated && address ? (
          <div className="flex items-center gap-2">
            {/* Network indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141828] border border-[#22283d] text-xs font-medium text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{chainName}</span>
            </div>

            {/* Wallet Address & Trigger */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#1a2035] hover:bg-[#222a45] border border-[#2b3554] px-3.5 py-2 text-sm font-medium text-white transition-all shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs">{formattedAddress}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-lg bg-[#3538cd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3538cd]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
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

