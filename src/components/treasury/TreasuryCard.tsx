"use client";

import React from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import type { Treasury } from "@/types/treasury";
import { AEVUM_EXPLORER } from "@/config/constants";

interface TreasuryCardProps {
  treasury: Treasury;
  isSelected: boolean;
  onSelect: () => void;
}

export function TreasuryCard({ treasury, isSelected, onSelect }: TreasuryCardProps) {
  const contractAddress = treasury.contractAddress;
  const formattedContract = contractAddress
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : "No contract";

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between gap-4 ${isSelected
        ? "bg-[#161a29] border-[#3538cd] ring-1 ring-[#3538cd]/50 shadow-lg shadow-[#3538cd]/10"
        : "bg-[#111423] border-[#1e2335] hover:border-[#29324e] hover:bg-[#141828]"
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Wallet size={20} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">{treasury.name}</h4>
            <span className="text-xs text-gray-400">Aevum Testnet (ID: {treasury.chainId})</span>
          </div>
        </div>

        {treasury.isActive ? (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={12} /> Active
          </span>
        ) : (
          <span className="text-[11px] text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">
            Inactive
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-[#1e2335]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Vault Contract</span>
          <a
            href={`${AEVUM_EXPLORER}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 font-mono text-indigo-400 hover:text-indigo-300"
          >
            <span>{formattedContract}</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Tracked Assets</span>
          <span className="font-semibold text-white">
            {treasury.assets?.length || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-gray-500">
          Created {new Date(treasury.createdAt).toLocaleDateString()}
        </span>
        <button
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isSelected
            ? "bg-[#3538cd] text-white"
            : "text-gray-300 hover:text-white bg-[#1a2035]"
            }`}
        >
          <span>{isSelected ? "Active Vault" : "Select Vault"}</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

