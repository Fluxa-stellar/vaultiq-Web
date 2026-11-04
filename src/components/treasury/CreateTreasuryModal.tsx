"use client";

import React, { useState } from "react";
import { Loader2, Plus, Wallet, X } from "lucide-react";
import type { CreateTreasuryDto } from "@/types/treasury";

interface CreateTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTreasuryDto) => Promise<void>;
}

export function CreateTreasuryModal({ isOpen, onClose, onSubmit }: CreateTreasuryModalProps) {
  const [name, setName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Treasury name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await onSubmit({
        name: name.trim(),
        contractAddress: contractAddress.trim() || undefined,
        chainId: 97, // BNB Chain Testnet default
      });

      setName("");
      setContractAddress("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create treasury";
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
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#3538cd]/20 text-[#6366f1]">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create New Treasury</h3>
              <p className="text-xs text-gray-400">Deploy or associate a smart vault on BNB Chain</p>
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
              Treasury Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operations Treasury, Payroll Vault"
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Vault Contract Address <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0xFc6E3Ec48AB20fA72D88cb7c985d85E23971105A (Defaults to standard vault)"
              className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Leave blank to use the official AI Treasury Vault contract on BNB Chain Testnet.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141828] border border-[#232a42] flex items-center justify-between text-xs">
            <span className="text-gray-400">Target Blockchain</span>
            <span className="font-semibold text-emerald-400">BNB Smart Chain Testnet (97)</span>
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
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#3538cd]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Vault...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create Treasury</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

