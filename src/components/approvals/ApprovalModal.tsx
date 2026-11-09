"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
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
  const { address, sendTransaction, refreshBalances, stableBalance, balance } = useWallet();
  const [manualTxHash, setManualTxHash] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [minedHash, setMinedHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  if (!isOpen || !approval) return null;

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
        if (data?.result?.status) {
          return true;
        }
      } catch {
        // retry polling
      }
    }
    return false;
  };

  const handleBroadcastOnChain = async () => {
    setIsBroadcasting(true);
    setError(null);
    setMinedHash(null);

    try {
      const tokenSym = (approval.tokenSymbol || "tUSD8").toUpperCase();
      const amountNum = parseFloat(approval.amount || "0.20");
      const recipient = (
        approval.recipientAddress || address || DEFAULT_VAULT_ADDRESS
      ).toLowerCase() as `0x${string}`;

      let hash = "";

      if (tokenSym === "TQDAY" || tokenSym === "QDAY" || tokenSym === "BNB") {
        // Native gas transfer
        hash = await sendTransaction(recipient, amountNum.toString());
      } else {
        // tUSD8 stablecoin (6 decimals)
        const amountUnits = BigInt(Math.floor(amountNum * 1e6));

        try {
          // 1. Primary: Vault executeAgentPayment
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
            args: [recipient, amountUnits, approval.reason || "Approved Multisig Transfer"],
          });
          hash = await sendTransaction(DEFAULT_VAULT_ADDRESS, "0", calldata);
        } catch (vaultErr: unknown) {
          const errMsg = vaultErr instanceof Error ? vaultErr.message : String(vaultErr);
          if (errMsg.toLowerCase().includes("user rejected") || errMsg.toLowerCase().includes("denied")) {
            throw vaultErr;
          }
          // 2. Direct ERC-20 transfer fallback from connected wallet
          const paddedRecipient = recipient.replace("0x", "").padStart(64, "0");
          const paddedUnits = amountUnits.toString(16).padStart(64, "0");
          const transferData = `0xa9059cbb${paddedRecipient}${paddedUnits}`;
          hash = await sendTransaction(TUSD8_TOKEN_ADDRESS, "0", transferData);
        }
      }

      setMinedHash(hash);
      await waitForReceipt(hash);
      await refreshBalances();
      await onExecute(approval.id, hash);
    } catch (err: unknown) {
      console.error("Execution failed:", err);
      const msg = err instanceof Error ? err.message : "On-chain transaction failed";
      setError(msg);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTxHash.trim()) {
      setError("Transaction hash is required");
      return;
    }

    try {
      setIsSubmittingManual(true);
      setError(null);
      await onExecute(approval.id, manualTxHash.trim());
      setManualTxHash("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution recording failed";
      setError(msg);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0f121d] border border-[#1e2335] shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#1e2335] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#3538cd]/20 text-[#6366f1]">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Execute Real On-Chain Transfer</h3>
              <p className="text-xs text-gray-400">Broadcast approved transaction to Aevum Testnet</p>
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

        {minedHash && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>Transaction Mined &amp; Confirmed On-Chain!</span>
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

        {/* Transfer Details Card */}
        <div className="p-4 rounded-xl bg-[#141828] border border-[#20263c] flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Action Type:</span>
            <span className="font-semibold text-white uppercase">{approval.actionType}</span>
          </div>

          <div className="flex justify-between text-gray-400">
            <span>Transfer Amount:</span>
            <span className="font-bold text-white text-base font-mono">
              {approval.amount} {approval.tokenSymbol || "tUSD8"}
            </span>
          </div>

          {approval.recipientAddress && (
            <div className="flex justify-between text-gray-400">
              <span>Recipient:</span>
              <span className="font-mono text-gray-200">
                {approval.recipientAddress.slice(0, 10)}...{approval.recipientAddress.slice(-8)}
              </span>
            </div>
          )}

          {approval.reason && (
            <div className="mt-1 pt-2 border-t border-[#1e2335] text-gray-300 italic text-[11px]">
              &ldquo;{approval.reason}&rdquo;
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-[#1e2335] flex items-center justify-between text-[11px] text-gray-400">
            <span>Connected Wallet Gas:</span>
            <span className="font-mono text-white">{balance || "0.00"} tQDAY</span>
          </div>
        </div>

        {/* Primary Action: Broadcast Real Transfer */}
        {!minedHash && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleBroadcastOnChain}
              disabled={isBroadcasting}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 shadow-lg shadow-[#3538cd]/20 transition-all disabled:opacity-50"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Confirming in MetaMask &amp; Mining Block...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Execute Real Transfer with Connected Wallet</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[11px] text-gray-400 hover:text-gray-300 text-center transition-colors py-1"
            >
              {showManualInput ? "Hide manual transaction hash option" : "Or enter transaction hash manually"}
            </button>
          </div>
        )}

        {/* Optional Manual Hash Input */}
        {showManualInput && !minedHash && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 pt-3 border-t border-[#1e2335]">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                On-Chain Transaction Hash
              </label>
              <input
                type="text"
                required
                value={manualTxHash}
                onChange={(e) => setManualTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl bg-[#141828] border border-[#232a42] px-3.5 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingManual || !manualTxHash.trim()}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-gray-200 bg-[#1e243d] hover:bg-[#283256] transition-colors disabled:opacity-50"
            >
              {isSubmittingManual ? <Loader2 size={14} className="animate-spin" /> : <span>Record Manual Hash</span>}
            </button>
          </form>
        )}

        {minedHash && (
          <div className="pt-2 border-t border-[#1e2335] flex justify-end">
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
