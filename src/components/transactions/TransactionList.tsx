"use client";

import React, { useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "TRANSFER" | "DEPOSIT" | "WITHDRAW">("ALL");

  const filtered = transactions.filter((tx) => {
    // Tab filter
    if (activeTab !== "ALL" && tx.type !== activeTab) {
      return false;
    }
    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTo = tx.toAddress?.toLowerCase().includes(q);
      const matchFrom = tx.fromAddress?.toLowerCase().includes(q);
      const matchHash = tx.txHash?.toLowerCase().includes(q);
      const matchReason = tx.reason?.toLowerCase().includes(q);
      return matchTo || matchFrom || matchHash || matchReason;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls: Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121625] border border-[#1e2335] w-fit">
          {(["ALL", "TRANSFER", "DEPOSIT", "WITHDRAW"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-[#3538cd] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "ALL" ? "All Activity" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search address or tx hash..."
            className="w-full rounded-xl bg-[#141828] border border-[#232a42] py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Transactions Container */}
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400 rounded-xl bg-[#121625] border border-[#1e2335]">
            Loading transaction history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#111423] border border-[#1e2335]">
            <div className="p-3 rounded-xl bg-[#1e2335] text-gray-500 mb-3">
              <ArrowRightLeft size={28} />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              No Transactions Found
            </h4>
            <p className="text-xs text-gray-400 max-w-sm">
              {searchTerm
                ? "No transactions match your current search query."
                : "Transactions executed through your treasury vault will appear here in real-time."}
            </p>
          </div>
        ) : (
          filtered.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
        )}
      </div>
    </div>
  );
}

