import { Bell, Wallet } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-20 shrink-0 items-center gap-x-6 border-b border-[#1e2335] bg-[#0a0c16] px-8 shadow-sm">
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Welcome back, Alex <span role="img" aria-label="wave">👋</span>
        </h1>
        <p className="text-sm text-gray-400">Here's what's happening with your treasury today.</p>
      </div>
      <div className="flex items-center gap-x-6">
        <button className="flex items-center gap-2 rounded-lg bg-[#3538cd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3538cd]/90 transition-colors">
          <Wallet size={16} />
          Connect Wallet
        </button>
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-300">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-x-4">
          <img
            className="h-9 w-9 rounded-full bg-gray-800"
            src="https://ui-avatars.com/api/?name=Alex&background=random"
            alt="Profile"
          />
        </div>
      </div>
    </header>
  );
}
