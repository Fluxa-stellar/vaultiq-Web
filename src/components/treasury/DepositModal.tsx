"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowDownLeft, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { transactionApi, treasuryApi } from "@/lib/api";
import type { Treasury } from "@/types/treasury";

interface DepositModalProps {
  treasury: Treasury | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositModal({ treasury, isOpen, onClose, onSuccess }: DepositModalProps) {
  const { address, balance, sendTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !treasury) return null;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim() || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount to deposit");
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
      setStatusMessage("Please confirm transaction in your wallet...");

      // 1. Send transaction on-chain via wallet provider
      const hash = await sendTransaction(treasury.contractAddress, amount.trim());
      setTxHash(hash);
      setStatusMessage("Transaction submitted! Recording deposit in treasury ledger...");

      // 2. Record transaction in backend database
      await transactionApi.record({
        treasuryId: treasury.id,
        txHash: hash,
        fromAddress: address,
        toAddress: treasury.contractAddress,
        amount: amount.trim(),
        tokenSymbol: "BNB",
        type: "DEPOSIT",
      });

      // 3. Sync treasury balances with BNB Chain
      setStatusMessage("Syncing on-chain vault reserves...");
      await treasuryApi.sync(treasury.id).catch(() => null);

      setStatusMessage("Deposit completed successfully!");
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
              <p className="text-xs text-gray-400">Transfer funds from connected wallet to smart vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-[#3538cd]/10 border border-[#3538cd]/30 text-xs text-[#6366f1] flex items-center gap-2">
            {isSubmitting && <Loader2 size={14} className="animate-spin shrink-0" />}
            {!isSubmitting && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        {txHash && (
          <div className="p-3 rounded-xl bg-[#141828] border border-[#21273d] text-xs flex items-center justify-between">
            <span className="text-gray-400">View on BscScan:</span>
            <a
              href={`https://testnet.bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-[#3538cd] hover:underline"
            >
              <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        <div className="p-3 rounded-xl bg-[#141828] border border-[#21273d] flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Destination Vault:</span>
            <span className="font-semibold text-white">{treasury.name}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Vault Address:</span>
            <span className="font-mono text-gray-300">
              {treasury.contractAddress.slice(0, 6)}...{treasury.contractAddress.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between text-gray-400 pt-1 border-t border-[#1e2335]">
            <span>Your Wallet Balance:</span>
            <span className="font-semibold text-emerald-400">
              {balance ? `${balance} tBNB` : "0 tBNB"}
            </span>
          </div>
        </div>

        <form onSubmit={handleDeposit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Deposit Amount (BNB) <span className="text-rose-400">*</span>
              </label>
              {balance && (
                <button
                  type="button"
                  onClick={() => {
                    const max = Math.max(0, parseFloat(balance) - 0.01);
                    setAmount(max.toFixed(4));
                  }}
                  className="text-[10px] text-[#3538cd] hover:underline"
                >
                  Max (reserving gas)
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 0.5"
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-[#1e2335] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1a2035] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft size={14} />
                  <span>Deposit BNB</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

