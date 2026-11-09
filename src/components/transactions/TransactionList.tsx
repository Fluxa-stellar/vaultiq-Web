"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  Download,
  ExternalLink,
  Search,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import type { Transaction } from "@/types/transaction";
import type { UnifiedTransactionItem } from "@/lib/onchainTransactions";
import { useAgentAllowances } from "@/hooks/useAgentAllowances";
import { AEVUM_EXPLORER, DEFAULT_VAULT_ADDRESS } from "@/config/constants";
import { formatAddress, formatCurrency } from "@/lib/formatters";

interface TransactionListProps {
  transactions: Transaction[];
  onChainTransactions?: UnifiedTransactionItem[];
  isLoading: boolean;
}

type FilterType = "ALL" | "DEPOSITS" | "INCOMING" | "AI_AUTONOMOUS" | "WITHDRAWALS";

export function TransactionList({
  transactions,
  onChainTransactions = [],
  isLoading,
}: TransactionListProps) {
  const { auditStream } = useAgentAllowances();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Combine real on-chain transactions, recent simulator items, and backend database entries
  const combinedItems = useMemo(() => {
    const list: UnifiedTransactionItem[] = [];
    const seenHashes = new Set<string>();

    // 1. Prioritize Real On-Chain Transactions from Aevum Testnet
    onChainTransactions.forEach((tx) => {
      const hashKey = tx.txHash.toLowerCase();
      if (!seenHashes.has(hashKey)) {
        list.push(tx);
        seenHashes.add(hashKey);
      }
    });

    // 2. Add Recent Simulator Dispatches from current session
    auditStream.forEach((item) => {
      const hashKey = item.txHash ? item.txHash.toLowerCase() : "";
      // Only add if not already captured by on-chain explorer or if real tx
      if (hashKey && !seenHashes.has(hashKey)) {
        // If we already have real on-chain transactions, omit stale fake mock 0x091c items
        const isMockHash = hashKey.startsWith("0x091c");
        if (onChainTransactions.length > 0 && isMockHash) {
          return;
        }

        list.push({
          id: item.id,
          timestamp: item.timestamp,
          agentAddress: item.agentAddress,
          agentName: item.agentName,
          recipient: item.recipient,
          recipientName: item.recipientName || "Compute Gateway",
          amount: item.amount,
          currency: item.currency,
          purpose: item.purpose,
          txHash: item.txHash,
          isAutonomous: item.isAutonomous,
          type: item.type === "VAULT_DEPOSIT" ? "VAULT_DEPOSIT" : item.isAutonomous ? "AI_SPEND" : "MANUAL_WITHDRAWAL",
          category: item.type === "VAULT_DEPOSIT" ? "DEPOSIT" : item.isAutonomous ? "AI_SPEND" : "WITHDRAWAL",
          isPositive: item.type === "VAULT_DEPOSIT",
          status: item.status === "REVERTED_BLOCKED" ? "REVERTED_BLOCKED" : "CONFIRMED",
        });
        seenHashes.add(hashKey);
      }
    });

    // 3. Add Backend DB Transactions (if not already recorded by hash)
    transactions.forEach((tx) => {
      const hashKey = (tx.txHash || "").toLowerCase();
      if (hashKey && !seenHashes.has(hashKey)) {
        const isDeposit = tx.type === "DEPOSIT";
        list.push({
          id: tx.id,
          timestamp: tx.createdAt,
          agentAddress: tx.fromAddress,
          agentName: isDeposit ? "Owner Wallet" : "Treasury Contract",
          recipient: tx.toAddress,
          recipientName: tx.toAddress ? formatAddress(tx.toAddress, 4) : "Recipient",
          amount: parseFloat(tx.amount || "0"),
          currency: tx.tokenSymbol || "tUSD8",
          purpose: tx.reason || (isDeposit ? "Treasury Vault Reserve Deposit" : "Manual Transfer"),
          txHash: tx.txHash || "",
          isAutonomous: false,
          type: isDeposit ? "VAULT_DEPOSIT" : "MANUAL_WITHDRAWAL",
          category: isDeposit ? "DEPOSIT" : "WITHDRAWAL",
          isPositive: isDeposit,
          status: tx.status === "CONFIRMED" ? "CONFIRMED" : "CONFIRMED",
        });
        seenHashes.add(hashKey);
      }
    });

    // Sort newest first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [onChainTransactions, auditStream, transactions]);

  // Apply filters
  const filtered = useMemo(() => {
    return combinedItems.filter((item) => {
      // Filter tab categories
      if (activeFilter === "DEPOSITS" && item.type !== "VAULT_DEPOSIT") {
        return false;
      }
      if (activeFilter === "INCOMING" && item.type !== "EXTERNAL_FUNDING") {
        return false;
      }
      if (activeFilter === "AI_AUTONOMOUS" && item.type !== "AI_SPEND") {
        return false;
      }
      if (activeFilter === "WITHDRAWALS" && item.type !== "VAULT_WITHDRAWAL" && item.type !== "MANUAL_WITHDRAWAL") {
        return false;
      }

      // Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchRecipient = item.recipient?.toLowerCase().includes(q) || item.recipientName?.toLowerCase().includes(q);
        const matchAgent = item.agentAddress?.toLowerCase().includes(q) || item.agentName?.toLowerCase().includes(q);
        const matchHash = item.txHash?.toLowerCase().includes(q);
        const matchPurpose = item.purpose?.toLowerCase().includes(q);
        const matchCurrency = item.currency?.toLowerCase().includes(q);
        return matchRecipient || matchAgent || matchHash || matchPurpose || matchCurrency;
      }
      return true;
    });
  }, [combinedItems, activeFilter, searchTerm]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const depositCount = combinedItems.filter((i) => i.type === "VAULT_DEPOSIT").length;
  const incomingCount = combinedItems.filter((i) => i.type === "EXTERNAL_FUNDING").length;
  const aiSpendCount = combinedItems.filter((i) => i.type === "AI_SPEND").length;
  const withdrawalCount = combinedItems.filter((i) => i.type === "VAULT_WITHDRAWAL" || i.type === "MANUAL_WITHDRAWAL").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls: Search and Filter Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Toggle: All, Deposits, Incoming Inflows, AI Autonomous, Withdrawals */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#121625] border border-[#1e2335]">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "ALL"
                ? "bg-[#3538cd] text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Activity ({combinedItems.length})
          </button>
          <button
            onClick={() => setActiveFilter("DEPOSITS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "DEPOSITS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft size={13} />
            <span>Vault Deposits ({depositCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("INCOMING")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "INCOMING"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Download size={13} />
            <span>External Inflows ({incomingCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("AI_AUTONOMOUS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "AI_AUTONOMOUS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Bot size={13} />
            <span>AI Spend ({aiSpendCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("WITHDRAWALS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "WITHDRAWALS"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ArrowUpRight size={13} />
            <span>Withdrawals ({withdrawalCount})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memo, address, or tx hash..."
            className="w-full rounded-xl bg-[#141828] border border-[#232a42] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Real-Time Activity & On-Chain Audit Stream Feed */}
      <div className="rounded-2xl bg-[#0f121e] border border-[#1e2335] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2335] bg-[#121626] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Transaction Flow & Identity</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Net Change</th>
                <th className="py-3.5 px-4">Purpose / Memo</th>
                <th className="py-3.5 px-4 text-right">Blockchain Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171b2d] text-xs">
              {isLoading && combinedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Syncing on-chain transactions from Aevum Testnet...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-xl bg-[#1a2035] text-gray-500">
                        <ArrowRightLeft size={24} />
                      </div>
                      <p className="text-sm font-semibold text-white">No transactions found</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {searchTerm
                          ? "No transactions match your search filter."
                          : "No transactions recorded for this filter category yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const date = new Date(item.timestamp);
                  const formattedDate = date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#141829] transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-gray-200 font-medium">{formattedDate}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{formattedTime}</span>
                        </div>
                      </td>

                      {/* Flow & Identity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {item.type === "VAULT_DEPOSIT" ? (
                            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <ArrowDownLeft size={14} />
                            </div>
                          ) : item.type === "EXTERNAL_FUNDING" ? (
                            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                              <Download size={14} />
                            </div>
                          ) : item.type === "AI_SPEND" ? (
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              <Bot size={14} />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <ArrowUpRight size={14} />
                            </div>
                          )}

                          <div className="flex flex-col">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              {item.agentName}
                              {item.type === "VAULT_DEPOSIT" && (
                                <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                  Vault Deposit
                                </span>
                              )}
                              {item.type === "EXTERNAL_FUNDING" && (
                                <span className="text-[9px] uppercase font-bold tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.2 rounded">
                                  External Funding
                                </span>
                              )}
                              {item.type === "AI_SPEND" && (
                                <span className="text-[9px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded">
                                  Autonomous
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              From: {formatAddress(item.agentAddress, 4)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-gray-300">
                          <span>
                            {item.recipientName && item.recipientName !== "Recipient"
                              ? `${item.recipientName} (${formatAddress(item.recipient, 3)})`
                              : formatAddress(item.recipient, 4)}
                          </span>
                          <button
                            onClick={() => handleCopy(item.recipient)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy address"
                          >
                            {copiedHash === item.recipient ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Net Change */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-sm ${
                              item.isPositive ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {item.isPositive ? "+" : "-"}
                            {formatCurrency(item.amount, 2, "$")}
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {item.currency}
                          </span>
                        </div>
                      </td>

                      {/* Purpose / Memo */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <span className="text-gray-300 italic truncate block">
                          &ldquo;{item.purpose}&rdquo;
                        </span>
                      </td>

                      {/* Clickable Tx Hash to QDay Explorer */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`${AEVUM_EXPLORER}/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-xs text-indigo-400 hover:text-indigo-300 hover:underline bg-[#161a2f] hover:bg-[#1f2545] border border-[#232a48] px-2.5 py-1 rounded-lg transition-colors"
                            title="View confirmed transaction on QDay Explorer (Aevum Testnet)"
                          >
                            <span>{formatAddress(item.txHash, 4)}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
