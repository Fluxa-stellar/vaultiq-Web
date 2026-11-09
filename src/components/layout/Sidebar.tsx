"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  Bot,
  SlidersHorizontal,
  CheckSquare,
  BarChart2,
  Settings,
  Gauge,
  Send,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { TELEGRAM_BOT_URL, TELEGRAM_BOT_USERNAME } from "@/config/constants";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Treasury", href: "/treasury", icon: Wallet },
  { name: "Agent Allowances", href: "/allowances", icon: Gauge, badge: "Aevum" },
  { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { name: "AI Agent", href: "/agent", icon: Bot },
  { name: "Rules & Automation", href: "/rules", icon: SlidersHorizontal },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, formattedAddress, chainName, balance, stableBalance, isAevumNetwork } = useWallet();

  return (
    <div className="flex h-full w-64 flex-col bg-[#111423] text-gray-400 border-r border-[#1e2335]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-[#2b334d] shrink-0 bg-[#161a2c]">
            <Image
              src="/vaultIQ.jpg"
              alt="VAULTIQ Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <div>
            <div className="font-bold tracking-tight text-white text-base leading-tight">
              VAULTIQ
            </div>
            <div className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
              On-Chain AI
            </div>
          </div>
        </Link>
        <p className="text-xs text-gray-400 mt-2">Intelligent on-chain treasury</p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#3538cd] text-white"
                  : "hover:bg-[#1e2335] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.name}</span>
              </div>
              {"badge" in item && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Telegram Live Alerts Link */}
      <div className="px-4 pb-2">
        <a
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-xs font-medium transition-all group"
        >
          <div className="flex items-center gap-2">
            <Send size={13} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Alerts: {TELEGRAM_BOT_USERNAME}</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </a>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl bg-[#1e2335] p-4 text-center">
          <div className="mb-2 flex justify-center">
            <Bot size={32} className="text-[#6366f1]" />
          </div>
          <div className="text-sm font-medium text-white flex items-center justify-center gap-2 mb-1">
            AI Guardrails Active <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-xs text-gray-400 mb-3">AevumAgentVault limit enforcement</p>
          <Link
            href="/allowances"
            className="block w-full rounded-lg bg-[#3538cd] py-2 text-sm font-medium text-white hover:bg-[#3538cd]/90 transition-colors"
          >
            Manage Allowances
          </Link>
        </div>

        {isAuthenticated && formattedAddress ? (
          <>
            <div className="rounded-xl bg-[#1e2335] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Wallet size={14} />
                </div>
                <span className="text-xs text-gray-200 truncate max-w-[120px]">
                  {isAevumNetwork ? "Aevum Testnet" : chainName}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">0xaba5</span>
            </div>

            <div className="rounded-xl bg-[#1e2335] p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white font-mono">0x</span>
              </div>
              <div className="truncate">
                <div className="text-sm text-gray-200 font-medium font-mono">{formattedAddress}</div>
                <div className="text-xs text-emerald-400 font-semibold truncate">
                  ${stableBalance || "0.00"} tUSD8 {balance ? `• ${balance} tQDAY` : ""}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-[#1e2335]/60 p-3 text-center border border-[#262c42]">
            <p className="text-xs text-gray-400">Wallet not connected</p>
          </div>
        )}
      </div>
    </div>
  );
}
