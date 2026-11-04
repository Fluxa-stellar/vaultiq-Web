"use client";

import React from "react";
import { Check, Copy, ExternalLink, RefreshCw, Shield } from "lucide-react";
import type { TreasuryOverview } from "@/types/treasury";

interface TreasuryBalanceProps {
  overview: TreasuryOverview | null;
  isSyncing: boolean;
  onSync: () => void;
}

export function TreasuryBalance({ overview, isSyncing, onSync }: TreasuryBalanceProps) {
  const [copied, setCopied] = React.useState(false);

  const contractAddress = overview?.contractAddress || "";
  const formattedContract = contractAddress
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : "No contract";

  const handleCopy = () => {
    if (!contractAddress) return;
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate total USD value from assets
  const totalValueUsd = overview?.assets?.reduce((acc, curr) => {
    const val = parseFloat(curr.valueUsd || "0");
    return acc + (isNaN(val) ? 0 : val);
  }, 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Treasury Value */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Total Vault Value</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              BNB Chain
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-400">
            {overview?.totalAssetsCount || 0} tracked asset{(overview?.totalAssetsCount || 0) === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="text-gray-400">Native Balance</span>
          <span className="font-mono font-medium text-white">
            {overview?.nativeBnbBalance || "0"} BNB
          </span>
        </div>
      </div>

      {/* Vault Smart Contract */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Smart Contract Vault</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <Shield size={12} />
              <span className="text-[10px]">Verified</span>
            </div>
          </div>
          <div className="text-sm font-mono font-semibold text-white truncate mb-2">
            {formattedContract}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2.5 py-1.5 rounded-lg transition-colors border border-[#2b3554]"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            {contractAddress && (
              <a
                href={`https://testnet.bscscan.com/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2.5 py-1.5 rounded-lg transition-colors border border-[#2b3554]"
              >
                <ExternalLink size={12} />
                <span>BscScan</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="text-gray-400">Vault Balance</span>
          <span className="font-mono font-medium text-white">
            {overview?.vaultBnbBalance || "0"} BNB
          </span>
        </div>
      </div>

      {/* On-Chain Sync & Activity */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Blockchain Sync</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400">Live</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 mb-3">
            Sync your vault assets and balance directly with BNB Smart Chain.
          </p>
          <button
            onClick={onSync}
            disabled={isSyncing || !overview}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#3538cd] py-2 text-xs font-semibold text-white hover:bg-[#3538cd]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing On-Chain..." : "Sync Balances"}</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="text-gray-400">Recent Transactions</span>
          <span className="font-semibold text-white">{overview?.recentTxCount || 0}</span>
        </div>
      </div>
    </div>
  );
}

