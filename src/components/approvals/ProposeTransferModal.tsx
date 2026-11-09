"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { encodeFunctionData } from "viem";
import { useWallet } from "@/hooks/useWallet";
import {
  AEVUM_EXPLORER,
  AEVUM_RPC,
  DEFAULT_VAULT_ADDRESS,
  TUSD8_TOKEN_ADDRESS,
} from "@/config/constants";
import type { ProposeTransactionDto, TransactionType } from "@/types/transaction";

interface ProposeTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (dto: Omit<ProposeTransactionDto, "treasuryId">) => Promise<unknown>;
  onRealTransferExecuted?: (txHash: string) => void;
}

const PRESET_AMOUNTS = ["0.05", "0.10", "0.20", "0.25", "0.50", "1.00"];

export function ProposeTransferModal({
  isOpen,
  onClose,
  onPropose,
  onRealTransferExecuted,
}: ProposeTransferModalProps) {
  const { address, sendTransaction, refreshBalances, balance, stableBalance } = useWallet();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("0.20");
  const [tokenSymbol, setTokenSymbol] = useState("tUSD8");
  const [actionType, setActionType] = useState<TransactionType>("TRANSFER");
  const [reason, setReason] = useState("");
  const [executionMode, setExecutionMode] = useState<"PROPOSAL" | "INSTANT_ONCHAIN">("PROPOSAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minedHash, setMinedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const waitForReceipt = async (hash: string): Promise<boolean> => {
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
        if (data?.result?.status) return true;
      } catch {
        // retry polling
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toAddress.trim()) {
      setError("Recipient address is required");
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      setError("Please enter a valid transfer amount");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMinedHash(null);

      const targetTokenAddress =
        tokenSymbol === "tUSD8" ? TUSD8_TOKEN_ADDRESS : "0x0000000000000000000000000000000000000000";

      if (executionMode === "INSTANT_ONCHAIN") {
        // Execute Real On-Chain Transfer via MetaMask
        const recipient = toAddress.trim().toLowerCase() as `0x${string}`;
        const amountNum = parseFloat(amount);
        let hash = "";

        if (tokenSymbol === "tQDAY") {
          hash = await sendTransaction(recipient, amountNum.toString());
        } else {
          // tUSD8 stablecoin (6 decimals)
          const amountUnits = BigInt(Math.floor(amountNum * 1e6));
          try {
            const calldata = encodeFunctionData({
              abi: [
                {
                  type: "function",
                  name: "executeAgentPayment",
                  inputs: [
                    { name: "recipient", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "memo", type: "string" },
                  ],
                  outputs: [{ name: "", type: "bool" }],
                  stateMutability: "nonpayable",
                },
              ],
              functionName: "executeAgentPayment",
              args: [recipient, amountUnits, reason || "Instant On-Chain Transfer"],
            });
            hash = await sendTransaction(DEFAULT_VAULT_ADDRESS, "0", calldata);
          } catch (vaultErr: unknown) {
            const errMsg = vaultErr instanceof Error ? vaultErr.message : String(vaultErr);
            if (errMsg.toLowerCase().includes("user rejected") || errMsg.toLowerCase().includes("denied")) {
              throw vaultErr;
            }
            // Direct ERC-20 transfer fallback from connected wallet
            const paddedRecipient = recipient.replace("0x", "").padStart(64, "0");
            const paddedUnits = amountUnits.toString(16).padStart(64, "0");
            const transferData = `0xa9059cbb${paddedRecipient}${paddedUnits}`;
            hash = await sendTransaction(TUSD8_TOKEN_ADDRESS, "0", transferData);
          }
        }

        setMinedHash(hash);
        await waitForReceipt(hash);
        await refreshBalances();
        if (onRealTransferExecuted) onRealTransferExecuted(hash);
      } else {
        // Submit for Multisig Governance Proposal
        await onPropose({
          toAddress: toAddress.trim(),
          amount: amount.trim(),
          tokenSymbol,
          tokenAddress: targetTokenAddress,
          type: actionType,
          reason: reason.trim() || undefined,
        });
        onClose();
      }
    } catch (err: unknown) {
      console.error("Propose/transfer failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to process transfer";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin"
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
              <h3 className="text-base font-semibold text-white">Propose Real Transfer</h3>
              <p className="text-xs text-gray-400">Initiate an on-chain transfer or governance proposal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[#1e2335] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Faucet Scale Reminder */}
        <div className="p-3 rounded-xl bg-[#3538cd]/10 border border-[#3538cd]/20 text-xs text-[#a5b4fc] flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#818cf8] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Aevum Faucet Testnet Calibrated:</span> Amounts are preset for your daily claim (<strong>1.00 tUSD8</strong> &amp; <strong>5.00 tQDAY</strong>).
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {minedHash && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>Real Transfer Mined On Aevum Testnet!</span>
            </div>
            <a
              href={`${AEVUM_EXPLORER}/tx/${minedHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-indigo-400 hover:underline break-all"
            >
              <span>{minedHash}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
        )}

        {!minedHash ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Recipient Address */}
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
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                <span className="text-gray-400 font-medium">Quick Fill:</span>
                {address && (
                  <button
                    type="button"
                    onClick={() => setToAddress(address)}
                    className="px-2 py-0.5 rounded-md bg-[#181d2e] hover:bg-[#222940] border border-[#2b3552] text-gray-300 hover:text-white transition-colors"
                  >
                    My Wallet ({address.slice(0, 6)}...)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setToAddress("0x2b8004f1a268fb4f15d74268e37602e1c981881f")}
                  className="px-2 py-0.5 rounded-md bg-[#181d2e] hover:bg-[#222940] border border-[#2b3552] text-gray-300 hover:text-white transition-colors"
                >
                  AI Agent Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setToAddress(DEFAULT_VAULT_ADDRESS)}
                  className="px-2 py-0.5 rounded-md bg-[#181d2e] hover:bg-[#222940] border border-[#2b3552] text-gray-300 hover:text-white transition-colors"
                >
                  Vault Contract
                </button>
              </div>
            </div>

            {/* Amount and Token */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Transfer Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.20"
                  className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Token Asset
                </label>
                <select
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#3538cd] cursor-pointer"
                >
                  <option value="tUSD8">tUSD8 (Vault Stablecoin)</option>
                  <option value="tQDAY">tQDAY (Native Gas Token)</option>
                </select>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">Quick Amounts:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors border ${
                    amount === amt
                      ? "bg-[#3538cd] text-white border-[#3538cd]"
                      : "bg-[#141828] text-gray-400 hover:text-white border-[#232a42] hover:border-gray-600"
                  }`}
                >
                  {amt} {tokenSymbol}
                </button>
              ))}
            </div>

            {/* Memo / Purpose */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Purpose / Memo <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. AI Compute Refill, Vendor Settlement, Emergency Guardrail"
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
            </div>

            {/* Execution Strategy */}
            <div className="p-3.5 rounded-xl bg-[#141828] border border-[#232a42] flex flex-col gap-2 text-xs">
              <span className="font-semibold text-gray-200">Execution Strategy:</span>
              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setExecutionMode("PROPOSAL")}
                  className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    executionMode === "PROPOSAL"
                      ? "bg-[#181d33] border-[#4338ca] text-white"
                      : "bg-[#0f121f] border-[#1e2335] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span className="font-semibold text-xs">Multisig Proposal</span>
                  <span className="text-[10px] opacity-80">Queues for review &amp; governance</span>
                </label>

                <label
                  onClick={() => setExecutionMode("INSTANT_ONCHAIN")}
                  className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    executionMode === "INSTANT_ONCHAIN"
                      ? "bg-[#181d33] border-[#4338ca] text-white"
                      : "bg-[#0f121f] border-[#1e2335] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-400" />
                    <span>Real Transfer</span>
                  </span>
                  <span className="text-[10px] opacity-80">Executes on-chain via MetaMask</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
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
                disabled={isSubmitting || !toAddress.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : executionMode === "INSTANT_ONCHAIN" ? (
                  <>
                    <Send size={14} />
                    <span>Execute Real Transfer</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Submit Proposal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end pt-3 border-t border-[#1e2335]">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

