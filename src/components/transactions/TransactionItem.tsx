"use client";

import React, { useState } from "react";
import {
  ArrowDownLeft,
  Check,
  Copy,
  ExternalLink,
  Send,
} from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { AEVUM_EXPLORER } from "@/config/constants";

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const [copied, setCopied] = useState<"from" | "to" | "hash" | null>(null);

  const handleCopy = (text: string, type: "from" | "to" | "hash") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const isDeposit = transaction.type === "DEPOSIT";

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "FAILED":
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#141828] border border-[#21273d] hover:border-[#2d3654] transition-all gap-4">
      {/* Left: Type Icon & Transfer Info */}
      <div className="flex items-center gap-3.5">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isDeposit
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          }`}
        >
          {isDeposit ? <ArrowDownLeft size={20} /> : <Send size={18} />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {transaction.type}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge()}`}
            >
              {transaction.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>To:</span>
            <span className="font-mono text-gray-300">{formatAddr(transaction.toAddress)}</span>
            <button
              onClick={() => handleCopy(transaction.toAddress, "to")}
              className="hover:text-white transition-colors"
              title="Copy Recipient Address"
            >
              {copied === "to" ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          {transaction.reason && (
            <p className="text-[11px] text-gray-500 italic mt-0.5 truncate max-w-sm">
              &ldquo;{transaction.reason}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Right: Amount & TxHash */}
      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1e2335]">
        <div className="text-sm font-mono font-bold text-white">
          {isDeposit ? "+" : "-"}
          {parseFloat(transaction.amount || "0").toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}{" "}
          {transaction.tokenSymbol || "tUSD8"}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          {transaction.txHash ? (
            <a
              href={`${AEVUM_EXPLORER}/tx/${transaction.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:underline font-mono"
            >
              <span>{formatAddr(transaction.txHash)}</span>
              <ExternalLink size={11} />
            </a>
          ) : (
            <span className="text-gray-500">Internal</span>
          )}
          <span>•</span>
          <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

