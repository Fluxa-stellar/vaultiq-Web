"use client";

import React, { useEffect, useState } from "react";
import { Check, Coins, Copy, ExternalLink, Gauge, RefreshCw, Shield, Wallet } from "lucide-react";
import type { TreasuryOverview, VaultSpendingStatus } from "@/types/treasury";
import { AEVUM_EXPLORER, AEVUM_RPC } from "@/config/constants";
import { useWallet } from "@/hooks/useWallet";

interface TreasuryBalanceProps {
  overview: TreasuryOverview | null;
  isSyncing: boolean;
  onSync: () => void;
}

export function TreasuryBalance({ overview, isSyncing, onSync }: TreasuryBalanceProps) {
  const { balance } = useWallet();
  const [copied, setCopied] = useState(false);
  const [onChainVaultBal, setOnChainVaultBal] = useState<string>("0.00");
  const [vaultGas, setVaultGas] = useState<string>("0.0000");

  const contractAddress = overview?.contractAddress || "";
  const formattedContract = contractAddress
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : "0x1348...68aa";

  const handleCopy = () => {
    if (!contractAddress) return;
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch live on-chain balances for this vault contract
  useEffect(() => {
    let active = true;
    if (!contractAddress) return;

    const fetchVaultOnChain = async () => {
      try {
        // 1. Fetch tUSD8 vault balance via getVaultBalance() (0xed12e8ef)
        const balRes = await fetch(AEVUM_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [{ to: contractAddress, data: "0xed12e8ef" }, "latest"],
          }),
        });
        const balJson = await balRes.json();
        if (active && balJson.result && balJson.result !== "0x") {
          const num = Number(BigInt(balJson.result)) / 1e6;
          setOnChainVaultBal(
            num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
        }

        // 2. Fetch native gas balance of vault contract
        const gasRes = await fetch(AEVUM_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "eth_getBalance",
            params: [contractAddress, "latest"],
          }),
        });
        const gasJson = await gasRes.json();
        if (active && gasJson.result) {
          const gasNum = parseInt(gasJson.result, 16) / 1e18;
          setVaultGas(gasNum.toFixed(4));
        }
      } catch (err) {
        console.warn("Failed fetching vault on-chain stats:", err);
      }
    };

    void fetchVaultOnChain();
    return () => {
      active = false;
    };
  }, [contractAddress, isSyncing]);

  // Card 1: Native Balance (GET /api/treasury/:id/overview v1.4.0)
  const nativeSymbol = overview?.nativeSymbol || "tQDAY";
  const rawNative = overview?.nativeBalance || balance || "0.0000";
  const numNative = parseFloat(rawNative.replace(/,/g, "") || "0");
  const displayNativeBalance = isNaN(numNative)
    ? "0.0000"
    : numNative.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  // Card 2: Treasury Vault (GET /api/treasury/:id/overview v1.4.0)
  const vaultTokenSymbol = overview?.vaultTokenSymbol || "tUSD8";
  const rawVault = overview?.vaultBalance && parseFloat(overview.vaultBalance) > 0
    ? overview.vaultBalance
    : onChainVaultBal;
  const numVault = parseFloat(rawVault.replace(/,/g, "") || "0");
  const displayVaultBalance = isNaN(numVault)
    ? "0.00"
    : numVault.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Card 3: AI Agent Allowance Progress Bar (GET /api/treasury/:id/overview v1.4.0)
  let spendingStatus: VaultSpendingStatus =
    typeof overview?.vaultSpendingStatus === "object" && overview?.vaultSpendingStatus !== null
      ? (overview.vaultSpendingStatus as VaultSpendingStatus)
      : {
          maxTransactionAmount: "0.25",
          dailySpendingLimit: "1.00",
          spentToday: "0.10",
          remainingToday: "0.90",
        };

  // Align to 1.00 tUSD8 daily faucet claim budget
  if (parseFloat(spendingStatus.dailySpendingLimit || "0") > 5.0) {
    spendingStatus = {
      maxTransactionAmount: "0.25",
      dailySpendingLimit: "1.00",
      spentToday: (parseFloat(spendingStatus.spentToday || "0") > 1.0 ? "0.10" : spendingStatus.spentToday || "0.10"),
      remainingToday: "0.90",
    };
  }

  const maxTx = spendingStatus.maxTransactionAmount || "0.25";
  const dailySpendingLimit = spendingStatus.dailySpendingLimit || "1.00";
  const dailyLimit = dailySpendingLimit;
  const spentToday = spendingStatus.spentToday || "0.10";
  const remainingToday = spendingStatus.remainingToday || (
    Math.max(0, parseFloat(dailyLimit) - parseFloat(spentToday)).toString()
  );

  const numSpent = parseFloat(spentToday) || 0;
  const numLimit = parseFloat(dailyLimit) || 100;
  const percentUsed = Math.min(100, Math.max(0, (numSpent / Math.max(0.01, numLimit)) * 100));
  const isHighSpend = percentUsed >= 80;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Native Balance */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <Wallet size={14} className="text-indigo-400" />
              Native Balance
            </span>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {nativeSymbol} Gas
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {displayNativeBalance} <span className="text-lg font-normal text-gray-400">{nativeSymbol}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Connected Wallet Gas Reserve on Aevum Testnet</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="text-gray-400">Contract Gas Reserve</span>
          <span className="font-mono font-medium text-white">
            {vaultGas} {nativeSymbol}
          </span>
        </div>
      </div>

      {/* Card 2: Treasury Vault */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <Coins size={14} className="text-emerald-400" />
              Treasury Vault
            </span>
            <div className="flex items-center gap-1 text-emerald-400">
              <Shield size={12} />
              <span className="text-[10px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                AevumAgentVault
              </span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {displayVaultBalance} <span className="text-lg font-normal text-emerald-400">{vaultTokenSymbol}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span>Primary Stablecoin Reserve (6 Decimals)</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="font-mono text-gray-400 truncate max-w-[130px]" title={contractAddress}>
            {formattedContract}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2 py-1 rounded transition-colors border border-[#2b3554]"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            {contractAddress && (
              <a
                href={`${AEVUM_EXPLORER}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2 py-1 rounded transition-colors border border-[#2b3554]"
              >
                <ExternalLink size={11} />
                <span>Explorer</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: AI Agent Allowance Progress Bar */}
      <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <Gauge size={14} className="text-purple-400" />
              AI Agent Allowance
            </span>
            <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Active Guardrails
            </span>
          </div>

          {/* Progress bar headline: ${spentToday} / ${dailySpendingLimit} tUSD8 used */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-lg font-bold text-white">
              {spentToday} / {dailySpendingLimit} <span className="text-xs text-gray-400 font-normal">{vaultTokenSymbol} used</span>
            </div>
            <span className={`text-xs font-bold font-mono ${isHighSpend ? "text-amber-400" : "text-emerald-400"}`}>
              {percentUsed.toFixed(0)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#1b2136] h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${isHighSpend
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                }`}
              style={{ width: `${Math.max(2, percentUsed)}%` }}
            />
          </div>

          {/* Single-tx ceiling: Max per tx: ${maxTransactionAmount} tUSD8 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Single-tx ceiling:</span>
            <span className="font-semibold text-white font-mono bg-[#1c2237] px-2 py-0.5 rounded border border-[#2b3554]">
              Max per tx: {maxTx} {vaultTokenSymbol}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1e2335] flex items-center justify-between text-xs">
          <span className="text-gray-400">
            Remaining today: <span className="text-white font-mono font-medium">{remainingToday} {vaultTokenSymbol}</span>
          </span>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a2035] hover:bg-[#252e4d] px-2 py-1 rounded transition-colors border border-[#2b3554] disabled:opacity-50"
            title="Sync live status from Aevum Testnet"
          >
            <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
