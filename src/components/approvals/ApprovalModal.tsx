"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send, X } from "lucide-react";
import type { Approval } from "@/types/transaction";

interface ApprovalModalProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (approvalId: string, txHash: string) => Promise<void>;
}

export function ApprovalModal({
  approval,
  isOpen,
  onClose,
  onExecute,
}: ApprovalModalProps) {
  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !approval) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setError("Transaction hash is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onExecute(approval.id, txHash.trim());
      setTxHash("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution recording failed";
      setError(msg);
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
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#3538cd]/20 text-[#6366f1]">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Execute Approved Transfer</h3>
              <p className="text-xs text-gray-400">Record on-chain blockchain execution</p>
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

        <div className="p-3.5 rounded-xl bg-[#141828] border border-[#20263c] flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Action:</span>
            <span className="font-semibold text-white uppercase">{approval.actionType}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Amount:</span>
            <span className="font-semibold text-white font-mono">
              {approval.amount} {approval.tokenSymbol || "BNB"}
            </span>
          </div>
          {approval.recipientAddress && (
            <div className="flex justify-between text-gray-400 truncate">
              <span>Recipient:</span>
              <span className="font-mono text-gray-200 truncate max-w-[200px]">
                {approval.recipientAddress}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Blockchain Transaction Hash (txHash) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Provide the transaction hash from your Web3 wallet or smart contract transaction on BNB Chain.
            </p>
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
              disabled={isSubmitting || !txHash.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Recording Execution...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Mark Executed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

