"use client";

import React, { useState } from "react";
import { Coins, Loader2, Plus, X } from "lucide-react";
import { treasuryApi } from "@/lib/api";

interface AddAssetModalProps {
  isOpen: boolean;
  treasuryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAssetModal({
  isOpen,
  treasuryId,
  onClose,
  onSuccess,
}: AddAssetModalProps) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress.trim()) {
      setFormError("Token address is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await treasuryApi.addAsset(treasuryId, {
        tokenAddress: tokenAddress.trim(),
      });

      setTokenAddress("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add asset";
      setFormError(msg);
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
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Track BEP-20 Token</h3>
              <p className="text-xs text-gray-400">Add a token to track in this treasury</p>
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              BEP-20 Token Contract Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="e.g. 0x337610d27c682E347C9cD60BE4B3b107C9d34dDd (USDT)"
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
              disabled={isSubmitting || !tokenAddress.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding Token...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

