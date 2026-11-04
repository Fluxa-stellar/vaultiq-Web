"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send, X } from "lucide-react";
import type { ProposeTransactionDto, TransactionType } from "@/types/transaction";
import type { TreasuryAsset } from "@/types/treasury";

interface ProposeTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: Omit<ProposeTransactionDto, "treasuryId">) => Promise<unknown>;
  assets?: TreasuryAsset[];
}

export function ProposeTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  assets = [],
}: ProposeTransactionModalProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("BNB");
  const [type, setType] = useState<TransactionType>("TRANSFER");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toAddress.trim()) {
      setFormError("Recipient address is required");
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      setFormError("Valid amount is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const matchedAsset = assets.find((a) => a.symbol === tokenSymbol);

      await onSubmit({
        toAddress: toAddress.trim(),
        amount: amount.trim(),
        tokenSymbol,
        tokenAddress: matchedAsset?.tokenAddress || "0x0000000000000000000000000000000000000000",
        type,
        reason: reason.trim() || undefined,
      });

      setToAddress("");
      setAmount("");
      setReason("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to propose transaction";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#3538cd]/20 text-[#6366f1]">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Propose Treasury Transfer</h3>
              <p className="text-xs text-gray-400">
                Creates an approval request for policy verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Recipient Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Amount <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Asset Token
              </label>
              <select
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
              >
                <option value="BNB">BNB (Native)</option>
                {assets
                  .filter((a) => a.symbol !== "BNB")
                  .map((a) => (
                    <option key={a.id} value={a.symbol}>
                      {a.symbol} ({a.name})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Operation Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
            >
              <option value="TRANSFER">Transfer</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="CONTRACT_EXECUTION">Contract Execution</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Purpose / Reason <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly server hosting fee, Contributor stipend"
              className="w-full resize-none rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#141828] border border-[#232a42] text-xs text-gray-400 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              This proposal will be submitted to the <strong>Approvals Queue</strong>. You will be able to review, approve, and sign the on-chain execution with your wallet.
            </span>
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
              disabled={isSubmitting || !toAddress.trim() || !amount.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Proposal...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Propose Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

