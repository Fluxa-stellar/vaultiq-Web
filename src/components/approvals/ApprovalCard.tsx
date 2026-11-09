"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import type { Approval } from "@/types/transaction";
import { AEVUM_EXPLORER } from "@/config/constants";

interface ApprovalCardProps {
  approval: Approval;
  isProcessing: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onExecute: (approval: Approval) => void;
}

export function ApprovalCard({
  approval,
  isProcessing,
  onApprove,
  onReject,
  onExecute,
}: ApprovalCardProps) {
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);

  const handleCopy = () => {
    if (!approval.recipientAddress) return;
    navigator.clipboard.writeText(approval.recipientAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      await onApprove(approval.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading("reject");
      await onReject(approval.id);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = () => {
    switch (approval.status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "EXECUTED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatAddr = (addr?: string | null) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="rounded-2xl bg-[#141828] border border-[#20263d] p-5 flex flex-col justify-between gap-4 hover:border-[#2b3552] transition-all">
      {/* Header: Action type & Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#1f253e] text-gray-200 border border-[#2b3554]">
          {approval.actionType}
        </span>

        <span
          className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadge()}`}
        >
          {approval.status === "PENDING" && <Clock size={11} />}
          {approval.status === "APPROVED" && <CheckCircle2 size={11} />}
          {approval.status === "EXECUTED" && <Check size={11} />}
          {approval.status === "REJECTED" && <XCircle size={11} />}
          <span>{approval.status}</span>
        </span>
      </div>

      {/* Main Amount & Recipient */}
      <div>
        <div className="text-2xl font-mono font-bold text-white mb-1">
          {approval.amount} {approval.tokenSymbol || "tUSD8"}
        </div>

        {approval.recipientAddress && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
            <span>Recipient:</span>
            <span className="font-mono text-gray-300">
              {formatAddr(approval.recipientAddress)}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-white transition-colors"
              title="Copy Recipient"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        )}

        {approval.reason && (
          <p className="text-xs text-gray-300 mt-2 bg-[#0e111a] p-2.5 rounded-lg border border-[#1b2133]">
            &ldquo;{approval.reason}&rdquo;
          </p>
        )}
      </div>

      {/* Execution TxHash if already executed */}
      {approval.txHash && (
        <div className="text-xs flex items-center justify-between p-2 rounded-lg bg-[#0e111a] border border-[#1b2133]">
          <span className="text-gray-500">Transaction Hash:</span>
          <a
            href={`${AEVUM_EXPLORER}/tx/${approval.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-mono text-indigo-400 hover:underline"
          >
            <span>{formatAddr(approval.txHash)}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Footer Details & Action Buttons */}
      <div className="pt-3 border-t border-[#1e2335] flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>Created {new Date(approval.createdAt).toLocaleDateString()}</span>
          {approval.expiresAt && (
            <span>Expires {new Date(approval.expiresAt).toLocaleDateString()}</span>
          )}
        </div>

        {approval.status === "PENDING" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all disabled:opacity-50"
            >
              {actionLoading === "reject" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <XCircle size={14} />
                  <span>Reject</span>
                </>
              )}
            </button>

            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all disabled:opacity-50"
            >
              {actionLoading === "approve" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Approve</span>
                </>
              )}
            </button>
          </div>
        )}

        {approval.status === "APPROVED" && (
          <button
            onClick={() => onExecute(approval)}
            disabled={isProcessing}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#3538cd] hover:bg-[#3538cd]/90 transition-all shadow-md shadow-[#3538cd]/20 disabled:opacity-50"
          >
            <Send size={14} />
            <span>Execute On-Chain</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

