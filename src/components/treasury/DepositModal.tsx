"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  Coins,
  ExternalLink,
  Info,
  Loader2,
  Shield,
  X,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { transactionApi, treasuryApi } from "@/lib/api";
import type { Treasury } from "@/types/treasury";
import { AEVUM_EXPLORER, AEVUM_RPC, TUSD8_TOKEN_ADDRESS } from "@/config/constants";

interface DepositModalProps {
  treasury: Treasury | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositModal({ treasury, isOpen, onClose, onSuccess }: DepositModalProps) {
  const { address, balance, stableBalance, sendTransaction, refreshBalances } = useWallet();
  const [tokenType, setTokenType] = useState<"tUSD8" | "tQDAY">("tUSD8");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !treasury) return null;

  const numStable = stableBalance ? parseFloat(stableBalance.replace(/,/g, "")) : 0;
  const numNative = balance ? parseFloat(balance.replace(/,/g, "")) : 0;
  const currentWalletBalance = tokenType === "tUSD8" ? stableBalance || "0.00" : balance || "0.0000";

  // Helper to poll for on-chain transaction receipt confirmation
  const waitForReceipt = async (hash: string): Promise<{ status: string | number }> => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(AEVUM_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getTransactionReceipt",
            params: [hash],
          }),
        });
        const data = await res.json();
        if (data?.result) {
          return data.result;
        }
      } catch {
        // Retry polling
      }
    }
    throw new Error("Transaction confirmation timed out. Check Aevum Explorer.");
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tokenType === "tQDAY") {
      setError(
        "AevumAgentVault does not accept direct native tQDAY deposits. The vault strictly custodies tUSD8 stablecoin for AI agent micropayments. Please switch to tUSD8."
      );
      return;
    }

    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount to deposit");
      return;
    }

    if (numAmount > numStable) {
      setError(`Insufficient tUSD8 balance. Your wallet has ${numStable.toFixed(2)} tUSD8.`);
      return;
    }

    if (!address) {
      setError("Wallet is not connected");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setTxHash(null);
      setIsSuccess(false);

      const units = BigInt(Math.floor(numAmount * 1e6));
      const paddedSpender = treasury.contractAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedUser = address.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedUnits = units.toString(16).padStart(64, "0");

      // Step 1: Check existing allowance: allowance(owner, spender) -> 0xdd62ed3e
      setStatusMessage("Checking tUSD8 allowance on Aevum Testnet...");
      const allowanceRes = await fetch(AEVUM_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            {
              to: TUSD8_TOKEN_ADDRESS,
              data: `0xdd62ed3e${paddedUser}${paddedSpender}`,
            },
            "latest",
          ],
        }),
      });
      const allowanceData = await allowanceRes.json();
      const currentAllowance =
        allowanceData?.result && allowanceData.result !== "0x"
          ? BigInt(allowanceData.result)
          : BigInt(0);

      // If allowance is insufficient, request approval
      if (currentAllowance < units) {
        setStatusMessage("Step 1 of 2: Please approve tUSD8 allowance in your wallet...");
        // approve(spender, amount) -> 0x095ea7b3
        const approveData = `0x095ea7b3${paddedSpender}${paddedUnits}`;
        const approveHash = await sendTransaction(TUSD8_TOKEN_ADDRESS, "0", approveData);
        setStatusMessage("Approval submitted! Waiting for block confirmation on Aevum L2...");
        const approveReceipt = await waitForReceipt(approveHash);
        if (approveReceipt.status === "0x0" || approveReceipt.status === 0) {
          throw new Error("tUSD8 token approval was reverted on-chain.");
        }
      }

      // Step 2: Call deposit(uint256) on AevumAgentVault contract -> 0xb6b55f25
      setStatusMessage("Step 2 of 2: Please confirm vault deposit in your wallet...");
      const depositData = `0xb6b55f25${paddedUnits}`;
      const hash = await sendTransaction(treasury.contractAddress, "0", depositData);
      setTxHash(hash);

      // Step 3: Wait for confirmation receipt
      setStatusMessage("Deposit broadcast! Waiting for confirmation on Aevum L2...");
      const receipt = await waitForReceipt(hash);

      if (receipt.status === "0x0" || receipt.status === 0) {
        throw new Error(
          "Transaction reverted on-chain (status 0x0). The AevumAgentVault smart contract rejected the deposit."
        );
      }

      // Step 4: Record in database ledger
      setStatusMessage("Recording deposit in treasury ledger...");
      await transactionApi
        .record({
          treasuryId: treasury.id,
          txHash: hash,
          fromAddress: address,
          toAddress: treasury.contractAddress,
          amount: amount.trim(),
          tokenSymbol: "tUSD8",
          type: "DEPOSIT",
        })
        .catch(() => null);

      // Step 5: Sync treasury balances
      await treasuryApi.sync(treasury.id).catch(() => null);
      await refreshBalances();

      setIsSuccess(true);
      setStatusMessage("Deposit confirmed on-chain successfully!");
      setAmount("");
      onSuccess();
    } catch (err: unknown) {
      console.error("Deposit failed:", err);
      const msg = err instanceof Error ? err.message : "Deposit failed";
      setError(msg);
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Deposit to Vault</h3>
              <p className="text-xs text-gray-400">Fund AevumAgentVault with tUSD8 settlement tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Deposit Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              isSuccess
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-[#3538cd]/10 border-[#3538cd]/30 text-[#818cf8]"
            }`}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin shrink-0" />}
            {isSuccess && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        {txHash && (
          <div className="p-3 rounded-xl bg-[#141828] border border-[#21273d] text-xs flex items-center justify-between">
            <span className="text-gray-400">Aevum Explorer:</span>
            <a
              href={`${AEVUM_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-indigo-400 hover:underline"
            >
              <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Destination & Balance Card */}
        <div className="p-3 rounded-xl bg-[#141828] border border-[#21273d] flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Destination Vault:</span>
            <span className="font-semibold text-white">{treasury.name}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Vault Contract:</span>
            <span className="font-mono text-gray-300">
              {treasury.contractAddress.slice(0, 6)}...{treasury.contractAddress.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between text-gray-400 pt-1 border-t border-[#1e2335]">
            <span>Your Available Balance:</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {currentWalletBalance} {tokenType}
            </span>
          </div>
        </div>

        {/* Token Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-300">Select Asset to Deposit</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTokenType("tUSD8");
                setError(null);
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                tokenType === "tUSD8"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30"
                  : "bg-[#141828] border-[#22283d] text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-emerald-400" />
                <span>tUSD8 Stablecoin</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Vault Native</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTokenType("tQDAY");
                setError(
                  "AevumAgentVault does not accept direct native tQDAY deposits. The vault strictly custodies tUSD8 stablecoin for AI agent micropayments. Please switch to tUSD8."
                );
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                tokenType === "tQDAY"
                  ? "bg-indigo-500/15 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30"
                  : "bg-[#141828] border-[#22283d] text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>tQDAY</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Gas Only</span>
            </button>
          </div>
        </div>

        {/* Warning if tQDAY is selected */}
        {tokenType === "tQDAY" ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle size={15} className="shrink-0 text-amber-400" />
              <span>Native tQDAY is Network Gas Only</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              <code>AevumAgentVault</code> does not accept native tQDAY transfers (direct transfers will revert on-chain). All treasury reserves and AI agent allowances are held in <strong>tUSD8</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setTokenType("tUSD8");
                setError(null);
              }}
              className="self-start px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Switch to tUSD8 (Available: {numStable.toFixed(2)} tUSD8)
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#141828] border border-[#21273d] text-[11px] text-gray-300 flex items-start gap-2">
            <Shield size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Deposits use standard 2-step verification: token approval followed by vault deposit into <code>AevumAgentVault</code>.
            </span>
          </div>
        )}

        <form onSubmit={handleDeposit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Deposit Amount ({tokenType}) <span className="text-rose-400">*</span>
              </label>
              {tokenType === "tUSD8" && numStable > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(numStable.toString())}
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Max Available ({numStable.toFixed(2)} tUSD8)
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0.01"
              max={tokenType === "tUSD8" ? numStable.toString() : undefined}
              required
              disabled={tokenType === "tQDAY" || isSubmitting}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={tokenType === "tUSD8" ? `e.g. ${Math.min(1, numStable)}` : "Select tUSD8"}
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors disabled:opacity-50"
            />
          </div>

          <div className="pt-3 border-t border-[#1e2335] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1a2035] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                tokenType === "tQDAY" ||
                isSubmitting ||
                !amount.trim() ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > numStable
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft size={14} />
                  <span>Deposit {tokenType} to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
