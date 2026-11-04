"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  LogOut,
  X,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { SUPPORTED_CHAINS } from "@/config/constants";

export function WalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    address,
    formattedAddress,
    chainId,
    balance,
    user,
    logout,
    switchChain,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentChainInfo = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const explorerUrl = currentChainInfo && address
    ? `${currentChainInfo.blockExplorer}/address/${address}`
    : `https://etherscan.io/address/${address}`;

  const handleSwitchNetwork = async (targetId: number) => {
    try {
      setSwitchingChainId(targetId);
      await switchChain(targetId);
    } catch (err) {
      console.error("Network switch failed:", err);
    } finally {
      setSwitchingChainId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-semibold text-white">Wallet Account</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Address Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#131625] border border-[#22283d]">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Connected Wallet</span>
            <span className="text-sm font-mono font-medium text-white">{formattedAddress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-[#1c2237] hover:bg-[#28304e] px-2.5 py-1.5 rounded-lg transition-colors"
              title="Copy Address"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-white bg-[#1c2237] hover:bg-[#28304e] rounded-lg transition-colors"
              title="View on Explorer"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Balance & Session info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#131625] border border-[#22283d] flex flex-col">
            <span className="text-xs text-gray-400">Balance</span>
            <span className="text-sm font-semibold text-white mt-1">
              {balance ? `${balance} ${currentChainInfo?.currency || "ETH"}` : "0.00"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#131625] border border-[#22283d] flex flex-col">
            <span className="text-xs text-gray-400">Session Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {user ? "JWT Verified" : "Connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Network Switcher */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Switch Network
          </label>
          <div className="flex flex-col gap-1.5">
            {SUPPORTED_CHAINS.map((chain) => {
              const isCurrent = chain.id === chainId;
              const isSwitching = switchingChainId === chain.id;

              return (
                <button
                  key={chain.id}
                  onClick={() => handleSwitchNetwork(chain.id)}
                  disabled={isCurrent || isSwitching}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-[#3538cd]/20 border border-[#3538cd] text-white"
                      : "bg-[#131625] border border-transparent text-gray-300 hover:border-[#2a3250] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? "bg-emerald-400" : "bg-gray-500"
                      }`}
                    />
                    <span>{chain.name}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                  {isSwitching && (
                    <span className="text-[10px] text-gray-400 animate-pulse">Switching...</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-[#1e2335] flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors py-1.5 px-2 rounded-lg hover:bg-rose-500/10"
          >
            <LogOut size={14} />
            Disconnect Wallet
          </button>
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
