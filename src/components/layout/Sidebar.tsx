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
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Treasury", href: "/treasury", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { name: "AI Agent", href: "/agent", icon: Bot },
  { name: "Rules & Automation", href: "/rules", icon: SlidersHorizontal },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, formattedAddress, chainName, balance } = useWallet();

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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#3538cd] text-white"
                  : "hover:bg-[#1e2335] hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        <div className="rounded-xl bg-[#1e2335] p-4 text-center">
          <div className="mb-2 flex justify-center">
            <Bot size={32} className="text-[#6366f1]" />
          </div>
          <div className="text-sm font-medium text-white flex items-center justify-center gap-2 mb-1">
            AI Agent is active <span className="h-2 w-2 rounded-full bg-green-500"></span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Monitoring your treasury 24/7</p>
          <Link
            href="/agent"
            className="block w-full rounded-lg bg-[#3538cd] py-2 text-sm font-medium text-white hover:bg-[#3538cd]/90 transition-colors"
          >
            Ask AI Agent
          </Link>
        </div>

        {isAuthenticated && formattedAddress ? (
          <>
            <div className="rounded-xl bg-[#1e2335] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <Wallet size={14} />
                </div>
                <span className="text-xs text-gray-200 truncate max-w-[120px]">{chainName}</span>
              </div>
              <span className="text-xs text-green-500">Connected</span>
            </div>

            <div className="rounded-xl bg-[#1e2335] p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white font-mono">0x</span>
              </div>
              <div className="truncate">
                <div className="text-sm text-gray-200 font-medium font-mono">{formattedAddress}</div>
                <div className="text-xs text-gray-400">{balance ? `${balance} Native` : "Active"}</div>
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
