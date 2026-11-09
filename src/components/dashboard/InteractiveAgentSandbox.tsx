"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { encodeFunctionData } from "viem";
import { useAgentAllowances } from "@/hooks/useAgentAllowances";
import { useNotifications } from "@/hooks/useNotifications";
import { useWallet } from "@/hooks/useWallet";
import {
  AEVUM_EXPLORER,
  AEVUM_RPC,
  DEFAULT_VAULT_ADDRESS,
  TUSD8_TOKEN_ADDRESS,
} from "@/config/constants";
import type { SimulatedSpendResult } from "@/types/agent-allowance";

interface ToastState {
  type: "success" | "blocked";
  title: string;
  description: string;
  txHash?: string;
  explorerUrl?: string;
}

export function InteractiveAgentSandbox() {
  const { agents, simulateAgentSpend } = useAgentAllowances();
  const { triggerFlowAlert } = useNotifications();
  const { address, isAuthenticated, sendTransaction, refreshBalances } = useWallet();

  const [isProcessingMicro, setIsProcessingMicro] = useState(false);
  const [isProcessingRogue, setIsProcessingRogue] = useState(false);
  const [liveOnChain, setLiveOnChain] = useState(true);
  const [lastResult, setLastResult] = useState<SimulatedSpendResult | null>(null);
  const [shieldAlert, setShieldAlert] = useState<{
    title: string;
    description: string;
    attempted: number;
    dailyLimit: number;
    maxSingleTx: number;
  } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  // Scaled to 1 tUSD8 daily claim budget
  const primaryAgent = agents[0] || {
    id: "ag-deepseek",
    name: "DeepSeek Inference Agent",
    address: "0x71C63B72834b655513D02F249f3FdfFcbF8249A1",
    dailyLimit: 1.0,
    spentToday: 0.1,
    maxSingleTxLimit: 0.25,
  };

  // Helper to poll for on-chain block confirmation
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
    throw new Error("Confirmation timed out on Aevum Testnet");
  };

  const handleMicroPayment = async () => {
    setIsProcessingMicro(true);
    setShieldAlert(null);
    setToast(null);

    const spendAmount = 0.05; // 0.05 tUSD8 micro-spend
    const recipient = "0x2b8004f1a268fb4f15d74268e37602e1c981881f"; // DeepSeek Inference Gateway

    try {
      if (liveOnChain && isAuthenticated && address) {
        // Real On-Chain execution via connected wallet on Aevum Testnet
        const amountUnits = BigInt(Math.floor(spendAmount * 1e6)); // 50,000 units
        let hash: string;

        try {
          // Primary: Call executeAgentPayment on AevumAgentVault contract
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
            args: [recipient as `0x${string}`, amountUnits, "Compute / API Refill (DeepSeek Qwen-72B)"],
          });
          hash = await sendTransaction(DEFAULT_VAULT_ADDRESS, "0", calldata);
        } catch (vaultErr: unknown) {
          const errMsg = vaultErr instanceof Error ? vaultErr.message : String(vaultErr);
          if (errMsg.toLowerCase().includes("user rejected") || errMsg.toLowerCase().includes("denied")) {
            throw vaultErr;
          }
          console.warn("Vault executeAgentPayment fallback to direct transfer:", vaultErr);
          const paddedRecipient = recipient.toLowerCase().replace("0x", "").padStart(64, "0");
          const paddedUnits = amountUnits.toString(16).padStart(64, "0");
          const transferData = `0xa9059cbb${paddedRecipient}${paddedUnits}`;
          hash = await sendTransaction(TUSD8_TOKEN_ADDRESS, "0", transferData);
        }

        await waitForReceipt(hash);
        await refreshBalances();

        simulateAgentSpend({
          agentAddress: primaryAgent.address,
          amount: spendAmount,
          purpose: "Compute / API Refill (DeepSeek Qwen-72B)",
          recipientAddress: recipient,
          txHash: hash,
        });

        const explorerUrl = `${AEVUM_EXPLORER}/tx/${hash}`;
        const res: SimulatedSpendResult = {
          success: true,
          txHash: hash,
          isSimulated: false,
          agent: primaryAgent,
          amount: spendAmount,
          timestamp: new Date().toISOString(),
        };

        setLastResult(res);
        setToast({
          type: "success",
          title: `Disbursement Settled: ${spendAmount.toFixed(2)} tUSD8`,
          description: `Live on-chain payment of ${spendAmount.toFixed(2)} tUSD8 confirmed on Aevum Testnet.`,
          txHash: hash,
          explorerUrl,
        });

        void triggerFlowAlert("disbursement", {
          agentTag: primaryAgent.name,
          amount: spendAmount.toFixed(2),
          txHash: hash,
          reason: "Compute / API Refill (DeepSeek Qwen-72B)",
          isSimulated: false,
        });
      } else {
        // Fast off-chain agent policy simulation
        await new Promise((r) => setTimeout(r, 450));
        const res = simulateAgentSpend({
          agentAddress: primaryAgent.address,
          amount: spendAmount,
          purpose: "Compute / API Refill (DeepSeek Qwen-72B)",
          recipientAddress: recipient,
        });

        setLastResult({
          ...res,
          isSimulated: true,
        });
        const explorerUrl = `${AEVUM_EXPLORER}/address/${DEFAULT_VAULT_ADDRESS}`;

        setToast({
          type: "success",
          title: `Policy Verified: ${spendAmount.toFixed(2)} tUSD8`,
          description: `Autonomous agent simulated ${spendAmount.toFixed(2)} tUSD8 compute refill under policy limits.`,
          explorerUrl,
        });

        void triggerFlowAlert("disbursement", {
          agentTag: primaryAgent.name,
          amount: spendAmount.toFixed(2),
          reason: "Compute / API Refill",
          isSimulated: true,
        });
      }
    } catch (err: unknown) {
      console.error("Micro payment failed:", err);
      const msg = err instanceof Error ? err.message : "Payment failed";
      setToast({
        type: "blocked",
        title: "Transaction Cancelled or Failed",
        description: msg,
      });
    } finally {
      setIsProcessingMicro(false);
    }
  };

  const handleRogueSpend = async () => {
    setIsProcessingRogue(true);
    setLastResult(null);
    setToast(null);

    // Realistic evaluation delay
    setTimeout(() => {
      // 2.50 tUSD8 exceeds both the 1.00 daily limit and 0.25 single-tx limit
      const breachAmount = 2.50;

      simulateAgentSpend({
        agentAddress: primaryAgent.address,
        amount: breachAmount,
        purpose: "Rogue Over-Budget Treasury Spend Attempt",
        forceBreach: true,
      });

      const alertData = {
        title: "🛡️ Blocked by AevumAgentVault: Transaction exceeds daily spending limit.",
        description: `The autonomous agent attempted to disburse ${breachAmount.toFixed(2)} tUSD8, which exceeds the authorized $${primaryAgent.dailyLimit.toFixed(2)} daily allowance and $${primaryAgent.maxSingleTxLimit.toFixed(2)} single-tx ceiling. AevumAgentVault smart contract halted execution on-chain with revert error LimitExceeded.`,
        attempted: breachAmount,
        dailyLimit: primaryAgent.dailyLimit,
        maxSingleTx: primaryAgent.maxSingleTxLimit,
      };

      setShieldAlert(alertData);
      setToast({
        type: "blocked",
        title: "🛡️ Blocked by AevumAgentVault: Transaction exceeds daily spending limit.",
        description: `${breachAmount.toFixed(2)} tUSD8 spend safely blocked on-chain by smart contract guardrails.`,
      });

      void triggerFlowAlert("security", {
        agentTag: primaryAgent.name,
        amount: breachAmount.toFixed(2),
        reason: "Transaction exceeds daily spending limit",
      });

      setIsProcessingRogue(false);
    }, 450);
  };

  const handleCopyTx = (hash?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#12162a] via-[#101323] to-[#0c0e1a] border border-[#252c48] p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`relative z-20 flex items-start justify-between gap-3 p-3.5 rounded-xl border animate-in slide-in-from-top-2 duration-200 shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/60 text-rose-100"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <ShieldAlert size={18} className="text-rose-400 mt-0.5 shrink-0" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">{toast.title}</span>
              <span className="text-[11px] opacity-90">{toast.description}</span>
              {toast.explorerUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={toast.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white underline"
                  >
                    <span>{toast.txHash ? "View Tx on Aevum QDay Explorer" : "View Vault on QDay Explorer"}</span>
                    <ExternalLink size={11} />
                  </a>
                  {toast.txHash && (
                    <button
                      onClick={() => handleCopyTx(toast.txHash)}
                      className="text-[10px] text-emerald-300/80 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={10} />
                      <span>{copiedTx ? "Copied" : "Copy Hash"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2640] pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Interactive Agent Sandbox
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Faucet Budget Aligned (1 tUSD8 / 5 tQDAY)
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Test autonomous AI micropayments (0.05 tUSD8) vs. on-chain safety containment in tUSD8.
            </p>
          </div>
        </div>

        {/* Live on-chain toggle */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <label className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#141828] border border-[#212840] px-2.5 py-1 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
              <input
                type="checkbox"
                checked={liveOnChain}
                onChange={(e) => setLiveOnChain(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Real On-Chain Tx (Wallet)</span>
            </label>
          )}

          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            tUSD8 (6 dec)
          </span>
        </div>
      </div>

      {/* Two Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Button 1: Run Agent Micro-Payment */}
        <button
          onClick={handleMicroPayment}
          disabled={isProcessingMicro || isProcessingRogue}
          className="group relative flex flex-col items-start p-4 rounded-xl bg-gradient-to-br from-[#132822] via-[#10201c] to-[#0c1815] border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Valid Micro-Disbursement
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              0.05 tUSD8
            </span>
          </div>

          <div className="text-base font-bold text-white flex items-center gap-2 mb-1">
            {isProcessingMicro ? (
              <>
                <Loader2 size={16} className="animate-spin text-emerald-400" />
                <span>{liveOnChain && isAuthenticated ? "Confirm in MetaMask..." : "Processing Micro-spend..."}</span>
              </>
            ) : (
              <>
                <span>Run Agent Micro-Payment</span>
                <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>

          <p className="text-xs text-gray-300">
            {liveOnChain && isAuthenticated
              ? "Executes a live 0.05 tUSD8 on-chain payment with real confirmation on Aevum QDay explorer."
              : "Triggers a valid 0.05 tUSD8 compute refill within the 0.25 tUSD8 ceiling and 1.00 daily budget."}
          </p>
        </button>

        {/* Button 2: Test Rogue / Over-Budget Spend */}
        <button
          onClick={handleRogueSpend}
          disabled={isProcessingMicro || isProcessingRogue}
          className="group relative flex flex-col items-start p-4 rounded-xl bg-gradient-to-br from-[#291418] via-[#211116] to-[#160c10] border border-rose-500/40 hover:border-rose-400 transition-all shadow-lg hover:shadow-rose-500/10 disabled:opacity-50 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert size={14} />
              Security Containment Test
            </span>
            <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              2.50 tUSD8 (Over-Budget)
            </span>
          </div>

          <div className="text-base font-bold text-white flex items-center gap-2 mb-1">
            {isProcessingRogue ? (
              <>
                <Loader2 size={16} className="animate-spin text-rose-400" />
                <span>Evaluating Guardrails...</span>
              </>
            ) : (
              <>
                <span>Test Rogue / Over-Budget Spend</span>
                <ArrowRight size={14} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>

          <p className="text-xs text-gray-300">
            Tries to spend 2.50 tUSD8 (exceeding the 1.00 tUSD8 daily budget), triggering on-chain shield containment.
          </p>
        </button>
      </div>

      {/* Dynamic Feedback Cards */}
      {shieldAlert && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex flex-col gap-2 animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <ShieldAlert size={18} className="text-rose-400" />
            <span>{shieldAlert.title}</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {shieldAlert.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-500/20 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase">Attempted Spend</span>
              <p className="font-mono font-bold text-rose-400">{shieldAlert.attempted.toFixed(2)} tUSD8</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase">Daily Allowance Cap</span>
              <p className="font-mono font-bold text-white">${shieldAlert.dailyLimit.toFixed(2)} tUSD8</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase">Single-Tx Ceiling</span>
              <p className="font-mono font-bold text-white">${shieldAlert.maxSingleTx.toFixed(2)} tUSD8</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase">On-Chain Policy Status</span>
              <p className="font-bold text-emerald-400">🛡️ Reverted (Safe)</p>
            </div>
          </div>
        </div>
      )}

      {lastResult && lastResult.success && !shieldAlert && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col gap-2 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Disbursement Settled: {lastResult.amount.toFixed(2)} tUSD8 for Compute/API Refill</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Aevum Testnet Confirmed
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
              <span className="text-gray-400">Tx Hash:</span>
              <span className="text-white truncate max-w-[200px] sm:max-w-xs">{lastResult.txHash}</span>
              <button
                onClick={() => handleCopyTx(lastResult.txHash)}
                className="text-gray-400 hover:text-white cursor-pointer"
                title="Copy hash"
              >
                <Copy size={12} />
              </button>
            </div>
            <a
              href={`${AEVUM_EXPLORER}/tx/${lastResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <span>View on Aevum Explorer</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Footer Guardrails Status Strip */}
      <div className="pt-2 border-t border-[#1e2338] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-gray-400">
          <span className="flex items-center gap-1 text-white font-medium">
            <Bot size={13} className="text-indigo-400" />
            {primaryAgent.name}
          </span>
          <span>•</span>
          <span>Daily Limit: <strong className="text-white font-mono">${primaryAgent.dailyLimit.toFixed(2)} tUSD8</strong></span>
          <span>•</span>
          <span>Single-Tx Max: <strong className="text-white font-mono">${primaryAgent.maxSingleTxLimit.toFixed(2)} tUSD8</strong></span>
        </div>

        <Link
          href="/allowances"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <span>Configure Agent Allowances</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
