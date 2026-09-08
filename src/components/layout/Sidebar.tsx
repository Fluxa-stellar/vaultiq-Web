import Link from "next/link";
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
  MessageSquare
} from "lucide-react";

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

  return (
    <div className="flex h-full w-64 flex-col bg-[#111423] text-gray-400 border-r border-[#1e2335]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Bot size={20} />
          </div>
          <div className="font-semibold text-white">AI Treasury Agent</div>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Your intelligent on-chain treasury</p>
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
          <button className="w-full rounded-lg bg-[#3538cd] py-2 text-sm font-medium text-white hover:bg-[#3538cd]/90 transition-colors">
            Ask AI Agent
          </button>
        </div>

        <div className="rounded-xl bg-[#1e2335] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
               <Wallet size={14} />
            </div>
            <span className="text-sm text-gray-200">BNB Smart Chain</span>
          </div>
          <span className="text-xs text-green-500">Connected</span>
        </div>

        <div className="rounded-xl bg-[#1e2335] p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center">
          </div>
          <div>
            <div className="text-sm text-gray-200 font-medium">0x8F3a...c2dE</div>
            <div className="text-xs text-gray-400">Balance: 1.248 BNB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
