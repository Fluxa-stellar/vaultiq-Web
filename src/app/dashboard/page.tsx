"use client";

import { Info, ArrowUpRight, ArrowDownRight, ShieldCheck, ArrowRight, PlayCircle, Send, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const performanceData = [
  { name: "May 08", value: 12000 },
  { name: "May 09", value: 14000 },
  { name: "May 10", value: 13500 },
  { name: "May 11", value: 15230.45 },
  { name: "May 12", value: 14800 },
  { name: "May 13", value: 16000 },
  { name: "May 14", value: 17432.82 },
];

const allocationData = [
  { name: "USDT", value: 10500, color: "#2ea043" },
  { name: "USDC", value: 3980, color: "#3538cd" },
  { name: "BNB", value: 1860, color: "#d29922" },
  { name: "BUSD", value: 1092.82, color: "#e36209" },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                Total Treasury Value <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">$17,432.82</div>
              <div className="text-xs font-medium text-green-500 flex items-center">
                +5.42% <span className="text-gray-500 ml-1">vs last 7 days</span>
              </div>
              {/* Mini chart placeholder */}
              <div className="h-10 mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={performanceData}>
                     <Line type="monotone" dataKey="value" stroke="#2ea043" strokeWidth={2} dot={false} />
                   </LineChart>
                 </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                24H Net Change <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">+$842.35</div>
              <div className="text-xs font-medium text-green-500 mb-2">+3.49%</div>
              <div className="flex items-end gap-1 h-10 mt-2">
                {/* Bar chart placeholder */}
                {[4, 7, 3, 8, 5, 10, 6].map((h, i) => (
                  <div key={i} className="flex-1 bg-green-500/80 rounded-sm" style={{ height: `${h * 10}%` }}></div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] relative overflow-hidden">
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                Active Rules <Info size={14} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">6</div>
              <div className="text-xs font-medium text-green-500">2 automation active</div>
              <div className="absolute right-4 bottom-4 text-[#3538cd]/20">
                <ShieldCheck size={64} />
              </div>
            </div>
          </div>

          {/* Row 2: Allocation & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="text-base font-medium text-white mb-4">Treasury Allocation</div>
              <div className="flex items-center">
                <div className="h-32 w-32 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 ml-4 space-y-3">
                  {allocationData.map((asset) => (
                    <div key={asset.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></div>
                        <span className="text-gray-300">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{(asset.value / 17432.82 * 100).toFixed(1)}%</span>
                        <span className="text-white font-medium">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="mt-4 text-xs font-medium text-[#3538cd] flex items-center gap-1 hover:text-[#3538cd]/80 transition-colors">
                View full breakdown <ArrowRight size={14} />
              </button>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-medium text-white">Recent Activity</div>
                <button className="text-xs font-medium text-gray-400 hover:text-white transition-colors">View all</button>
              </div>
              <div className="space-y-4">
                {[
                  { type: "Received", amount: "+1,200 USDT", from: "0x3bA...d91F", time: "2m ago", isPositive: true },
                  { type: "Sent", amount: "-500 USDT", from: "To 0x7f2...a8E1", time: "15m ago", isPositive: false },
                  { type: "Received", amount: "+0.75 BNB", from: "From 0x91c...9a8B", time: "1h ago", isPositive: true },
                  { type: "Sent", amount: "-2,000 USDT", from: "To 0x1d3...b22F", time: "3h ago", isPositive: false },
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${act.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {act.isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{act.type}</div>
                        <div className="text-xs text-gray-400">{act.from}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${act.isPositive ? 'text-green-500' : 'text-red-500'}`}>{act.amount}</div>
                      <div className="text-xs text-gray-400">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Performance & Top Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-medium text-white">Treasury Performance</div>
                <select className="bg-[#1e2335] text-xs text-gray-300 rounded-md px-2 py-1 border-none outline-none">
                  <option>Last 7 Days</option>
                </select>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3538cd" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3538cd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e2335', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#3538cd' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3538cd" strokeWidth={3} dot={{ r: 4, fill: '#3538cd', strokeWidth: 2, stroke: '#131620' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
              <div className="text-base font-medium text-white mb-4">Top Assets</div>
              <div className="space-y-4">
                {[
                  { symbol: "USDT", name: "Tether", amount: "$10,500.00", pct: "60.3%", color: "bg-green-500" },
                  { symbol: "USDC", name: "USD Coin", amount: "$3,980.00", pct: "22.9%", color: "bg-blue-500" },
                  { symbol: "BNB", name: "BNB", amount: "$1,860.00", pct: "10.7%", color: "bg-yellow-500" },
                  { symbol: "BUSD", name: "Binance USD", amount: "$1,092.82", pct: "6.1%", color: "bg-yellow-600" },
                ].map((asset, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${asset.color} text-white font-bold text-xs`}>
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{asset.symbol}</div>
                        <div className="text-xs text-gray-400">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{asset.amount}</div>
                      <div className="text-xs text-gray-400">{asset.pct}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* AI Agent */}
          <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335] flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">AI Agent</div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div className="flex gap-3">
                <div className="shrink-0 text-xl"><span role="img" aria-label="wave">👋</span></div>
                <div className="text-sm text-gray-300 bg-[#1e2335] p-3 rounded-lg rounded-tl-none">
                  Hi Alex! I've analyzed your treasury and here's what I found.
                </div>
              </div>

              <div className="bg-[#1e2335] rounded-xl p-4 border border-[#2d3348]">
                <div className="flex items-center gap-2 text-purple-400 font-medium mb-2 text-sm">
                  <PlayCircle size={16} /> Insight
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Your treasury balance is healthy. You have 12% more stablecoins than last week.
                </p>
                <div className="h-12 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.slice(3)}>
                      <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1e2335] rounded-xl p-4 border border-[#2d3348]">
                <div className="flex items-center gap-2 text-green-400 font-medium mb-2 text-sm">
                  <CheckCircle2 size={16} /> Recommendation
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  You have excess USDT. Consider moving 500 USDT to your reserve wallet.
                </p>
                <button className="w-full bg-[#3538cd] hover:bg-[#3538cd]/90 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Review Recommendation
                </button>
              </div>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="w-full bg-[#1e2335] border border-[#2d3348] rounded-xl py-3 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-[#3538cd]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Automation Status */}
          <div className="rounded-xl bg-[#131620] p-5 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-medium text-white">Automation Status</div>
              <div className="text-xs font-medium text-green-500">2 Active</div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#1e2335] p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                    <ArrowRightLeft size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Weekly Reserve Transfer</div>
                    <div className="text-xs text-gray-400">Every Friday • 100 USDT</div>
                  </div>
                </div>
                <div className="w-8 h-4 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#1e2335] p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                    <Info size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Low Balance Alert</div>
                    <div className="text-xs text-gray-400">If balance &lt; $2,000</div>
                  </div>
                </div>
                <div className="w-8 h-4 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <button className="mt-4 text-xs font-medium text-[#3538cd] flex items-center gap-1 hover:text-[#3538cd]/80 transition-colors">
              View all rules <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Banner */}
      <div className="rounded-xl bg-[#1e1c3a] border border-[#302c63] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#3538cd]/20 text-[#6366f1] flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-base font-bold text-white mb-0.5">Your treasury is protected</div>
            <div className="text-sm text-gray-300">Smart contract is secure and all rules are working as expected.</div>
          </div>
        </div>
        <button className="px-4 py-2 rounded-lg bg-[#302c63] hover:bg-[#3d387a] text-white text-sm font-medium transition-colors">
          View Security
        </button>
      </div>

    </div>
  );
}
