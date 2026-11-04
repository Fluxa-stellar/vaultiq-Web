"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  LogOut,
  Mail,
  Save,
  Server,
  Settings,
  ShieldCheck,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { userApi, walletApi } from "@/lib/api";
import { BSC_TESTNET_EXPLORER, CHAINS } from "@/config/constants";

export default function SettingsPage() {
  const {
    user,
    wallets,
    address,
    chainId,
    chainName,
    isAuthenticated,
    refreshProfile,
    switchChain,
    logout,
  } = useWallet();

  // Profile Form State
  const [name, setName] = useState<string>(() => user?.name || "");
  const [email, setEmail] = useState<string>(() => user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(() => user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Synchronize state when user changes during rendering
  const [syncedUserId, setSyncedUserId] = useState<string | undefined>(user?.id);
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setName(user.name || "");
    setEmail(user.email || "");
    setAvatarUrl(user.avatarUrl || "");
  }

  // Copy status
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await userApi.updateProfile({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      await walletApi.setPrimary(walletId);
      await refreshProfile();
    } catch (err: unknown) {
      console.error("Failed setting primary wallet:", err);
      alert(err instanceof Error ? err.message : "Failed to set primary wallet");
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
          <p className="text-xs text-gray-400">
            Account preferences, connected EVM identities, and network configurations
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Settings (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Profile Form Card */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">User Profile</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check size={14} />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {saveError}
                </div>
              )}

              {/* Avatar Preview & URL */}
              <div className="flex items-center gap-4 pb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-lg font-bold overflow-hidden border-2 border-[#1e2335]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={name || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{(name || address || "U").slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-[#181d2d] text-white text-xs px-3 py-2 rounded-lg border border-[#23293e] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Treasury Operations Lead"
                    className="w-full bg-[#181d2d] text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-[#23293e] focus:outline-none focus:border-indigo-500"
                  />
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Notification Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="treasury-alerts@company.org"
                    className="w-full bg-[#181d2d] text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-[#23293e] focus:outline-none focus:border-indigo-500"
                  />
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Linked Wallets Card */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Linked Wallets</h3>
              </div>
              <span className="text-xs text-gray-400">{wallets.length} connected</span>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              EVM addresses authorized under your session. One wallet serves as the primary vault owner.
            </p>

            <div className="space-y-3">
              {wallets.length === 0 ? (
                <p className="text-xs text-gray-500 py-3 text-center">No wallets linked yet.</p>
              ) : (
                wallets.map((w) => {
                  const isCurrent = address?.toLowerCase() === w.address.toLowerCase();
                  return (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-lg bg-[#181d2d] border border-[#23293e] flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCurrent ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium text-white">
                              {w.address.slice(0, 8)}...{w.address.slice(-6)}
                            </span>
                            {w.isPrimary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Star size={9} />
                                Primary
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active EOA
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500">Chain ID: {w.chainId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(w.address)}
                          className="p-1.5 rounded-md hover:bg-[#252c42] text-gray-400 hover:text-white transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === w.address ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <a
                          href={`${BSC_TESTNET_EXPLORER}/address/${w.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-[#252c42] text-gray-400 hover:text-white transition-colors"
                          title="View on BscScan"
                        >
                          <ExternalLink size={13} />
                        </a>
                        {!w.isPrimary && (
                          <button
                            onClick={() => void handleSetPrimary(w.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white bg-[#22293e] hover:bg-[#2c344e] rounded-md transition-colors"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Network & System Configuration (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Network Info Card */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Network Status</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#1e2335]">
                <span className="text-gray-400">Current Chain</span>
                <span className="font-semibold text-white">{chainName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1e2335]">
                <span className="text-gray-400">Chain ID</span>
                <span className="font-mono text-indigo-400">{chainId ?? "Disconnected"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1e2335]">
                <span className="text-gray-400">Currency</span>
                <span className="font-semibold text-amber-400">BNB (18 decimals)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1e2335]">
                <span className="text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Operational
                </span>
              </div>
            </div>

            {/* Quick Switch Network Buttons */}
            <div className="mt-5 pt-4 border-t border-[#1e2335]">
              <label className="block text-[11px] font-medium text-gray-400 mb-2">
                Switch Network
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void switchChain(CHAINS.BSC_TESTNET)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    chainId === CHAINS.BSC_TESTNET
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-[#181d2d] border-[#23293e] text-gray-400 hover:text-white"
                  }`}
                >
                  BSC Testnet
                </button>
                <button
                  onClick={() => void switchChain(CHAINS.BSC_MAINNET)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    chainId === CHAINS.BSC_MAINNET
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-[#181d2d] border-[#23293e] text-gray-400 hover:text-white"
                  }`}
                >
                  BSC Mainnet
                </button>
              </div>
            </div>
          </div>

          {/* RPC & Node Endpoints */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-4">
              <Server size={18} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Infrastructure</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Backend API Host</span>
                <span className="font-mono text-[11px] text-gray-300 bg-[#181d2d] px-2.5 py-1 rounded block truncate">
                  https://ai-treasury-backend.onrender.com
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">BNB Testnet Public RPC</span>
                <span className="font-mono text-[11px] text-gray-300 bg-[#181d2d] px-2.5 py-1 rounded block truncate">
                  https://data-seed-prebsc-1-s1.binance.org:8545/
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">Block Explorer</span>
                <a
                  href={BSC_TESTNET_EXPLORER}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>testnet.bscscan.com</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Security & Session */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Session Security</h3>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Cryptographically signed SIWE session. JWT tokens expire automatically.
            </p>

            {isAuthenticated && (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors"
              >
                <LogOut size={14} />
                <span>Disconnect & Clear Session</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
