"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import {
  SUPPORTED_CHAINS,
  DEFAULT_VAULT_ADDRESS,
  TUSD8_TOKEN_ADDRESS,
  AEVUM_EXPLORER,
} from "@/config/constants";

export function WalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    address,
    formattedAddress,
    chainId,
    balance,
    stableBalance,
    logout,
    switchChain,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
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
            <span className="text-xs text-gray-400">Gas Reserve ({currentChainInfo?.currency || "tQDAY"})</span>
            <span className="text-sm font-semibold text-white mt-1">
              {balance ? `${balance} ${currentChainInfo?.currency || "tQDAY"}` : `0.00 ${currentChainInfo?.currency || "tQDAY"}`}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#131625] border border-emerald-500/20 bg-emerald-500/5 flex flex-col">
            <span className="text-xs text-emerald-400 font-medium">tUSD8 Stablecoin (6 dec)</span>
            <span className="text-sm font-bold text-white mt-1">
              {stableBalance ? `$${stableBalance}` : "$0.00"} tUSD8
            </span>
          </div>
        </div>

        {/* Aevum Contracts Reference */}
        <div className="p-3 rounded-xl bg-[#0e111d] border border-[#20273f] text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <Shield size={13} className="text-emerald-400" />
              Aevum Testnet Contracts
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
              0xaba5 (44005)
            </span>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] bg-[#141828] p-2 rounded-lg border border-[#1b2238]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-sans">Vault Contract:</span>
              <span className="text-gray-200">{DEFAULT_VAULT_ADDRESS.slice(0, 10)}...{DEFAULT_VAULT_ADDRESS.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyText(DEFAULT_VAULT_ADDRESS, "vault")}
                className="px-2 py-1 rounded bg-[#1c233c] hover:bg-[#252f50] text-[10px] text-gray-300 hover:text-white transition-colors"
              >
                {copiedItem === "vault" ? <Check size={11} className="text-emerald-400 inline mr-1" /> : null}
                {copiedItem === "vault" ? "Copied" : "Copy"}
              </button>
              <a
                href={`${AEVUM_EXPLORER}/address/${DEFAULT_VAULT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded bg-[#1c233c] hover:bg-[#252f50] text-gray-300 hover:text-white"
                title="View on QDay Explorer"
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] bg-[#141828] p-2 rounded-lg border border-[#1b2238]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-sans">tUSD8 Stablecoin:</span>
              <span className="text-emerald-400">{TUSD8_TOKEN_ADDRESS.slice(0, 10)}...{TUSD8_TOKEN_ADDRESS.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyText(TUSD8_TOKEN_ADDRESS, "token")}
                className="px-2 py-1 rounded bg-[#1c233c] hover:bg-[#252f50] text-[10px] text-gray-300 hover:text-white transition-colors"
              >
                {copiedItem === "token" ? <Check size={11} className="text-emerald-400 inline mr-1" /> : null}
                {copiedItem === "token" ? "Copied" : "Copy"}
              </button>
              <a
                href={`${AEVUM_EXPLORER}/token/${TUSD8_TOKEN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded bg-[#1c233c] hover:bg-[#252f50] text-gray-300 hover:text-white"
                title="View on QDay Explorer"
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Network Switcher */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Network
            </label>
            <span className="text-[10px] text-indigo-400 font-medium">Aevum Builder Challenge</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SUPPORTED_CHAINS.map((chain) => {
              const isCurrent = chain.id === chainId;
              const isSwitching = switchingChainId === chain.id;
              const isAevum = chain.id === 44005;

              return (
                <button
                  key={chain.id}
                  onClick={() => handleSwitchNetwork(chain.id)}
                  disabled={isCurrent || isSwitching}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isCurrent
                    ? "bg-[#3538cd]/20 border border-[#3538cd] text-white"
                    : isAevum
                      ? "bg-[#181d33] border border-indigo-500/30 text-white hover:border-indigo-500"
                      : "bg-[#131625] border border-transparent text-gray-300 hover:border-[#2a3250] hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${isCurrent ? "bg-emerald-400" : isAevum ? "bg-indigo-400 animate-pulse" : "bg-gray-500"
                        }`}
                    />
                    <span>{chain.name}</span>
                    {isAevum && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        Target Chain 44005
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                  {!isCurrent && isAevum && (
                    <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded hover:bg-indigo-500/20">
                      Switch Now
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
