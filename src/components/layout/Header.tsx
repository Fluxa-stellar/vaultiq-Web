"use client";

import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";
import { NotificationBellDropdown } from "@/components/notifications/NotificationBellDropdown";
import { useWallet } from "@/hooks/useWallet";

export function Header() {
  const { user, formattedAddress, isAuthenticated } = useWallet();

  const displayName = user?.name || (isAuthenticated && formattedAddress ? formattedAddress : null);
  const avatarUrl =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName || "Guest"
    )}&background=3538cd&color=fff`;

  return (
    <header className="flex h-20 shrink-0 items-center gap-x-6 border-b border-[#1e2335] bg-[#0a0c16] px-8 shadow-sm">
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          {displayName ? (
            <>
              Welcome back, {displayName} <span role="img" aria-label="wave">👋</span>
            </>
          ) : (
            <>
              Welcome to VAULTIQ <span role="img" aria-label="wave">👋</span>
            </>
          )}
        </h1>
        <p className="text-sm text-gray-400">
          {isAuthenticated
            ? "Here's what's happening with your treasury today."
            : "Connect your Web3 wallet to manage treasuries and execute AI transactions."}
        </p>
      </div>

      <div className="flex items-center gap-x-4">
        <WalletButton />

        <NotificationBellDropdown />

        <div className="flex items-center">
          <Image
            className="h-9 w-9 rounded-full bg-gray-800 ring-2 ring-[#1e2335] object-cover"
            src={avatarUrl}
            alt="Profile avatar"
            width={36}
            height={36}
            unoptimized
          />
        </div>
      </div>
    </header>
  );
}
