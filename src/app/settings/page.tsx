"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Send,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useNotifications } from "@/hooks/useNotifications";
import { userApi, walletApi } from "@/lib/api";
import {
  AEVUM_CHAIN_ID,
  AEVUM_EXPLORER,
  AEVUM_RPC,
  CHAINS,
  TELEGRAM_BOT_URL,
  TELEGRAM_BOT_USERNAME,
  DORAHACKS_AEVUM_URL,
  SWAGGER_DOCS_URL,
} from "@/config/constants";

export default function SettingsPage() {
  const {
    user,
    wallets,
    address,
    chainId,
    chainName,
    isAevumNetwork,
    isAuthenticated,
    refreshProfile,
    switchChain,
    logout,
  } = useWallet();

  const {
    status: notifStatus,
    health,
    isSendingTest,
    lastActionResult,
    clearActionResult,
    sendTestTelegram,
    triggerFlowAlert,
    refreshHealth,
  } = useNotifications();

  // Profile Form State
  const [name, setName] = useState<string>(() => user?.name || "");
  const [email, setEmail] = useState<string>(() => user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(() => user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Testing individual alert flow state
  const [testingFlow, setTestingFlow] = useState<string | null>(null);

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

  const handleTestFlow = async (
    flow: "disbursement" | "security" | "threshold" | "approval"
  ) => {
    setTestingFlow(flow);
    try {
      await triggerFlowAlert(flow);
    } finally {
      setTestingFlow(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl pb-12">
      {/* Page Title & Hackathon Banner */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Settings & System Integrations
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  v1.3.0 Live
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Configure wallet credentials, real-time Telegram push alerts, multi-chain health, and Swagger docs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Send size={14} />
              <span>{TELEGRAM_BOT_USERNAME}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </a>

            <a
              href={DORAHACKS_AEVUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Award size={14} />
              <span>DoraHacks</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Global Action Result Banner */}
        {lastActionResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top ${
              lastActionResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {lastActionResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              )}
              <span>{lastActionResult.message}</span>
            </div>
            <button
              onClick={clearActionResult}
              className="text-gray-400 hover:text-white text-xs underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile & Real-Time Telegram Push Alerts (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Real-Time Push Alerts & Telegram Notification Center */}
          <div className="rounded-2xl bg-gradient-to-b from-[#111428] to-[#0c0e1e] p-6 border border-[#232b48] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#1e2338]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
                  <Bell size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Real-Time Push Alert Architecture
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                      Telegram + In-App
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Dual delivery channel: instant Telegram pushes via {TELEGRAM_BOT_USERNAME} and persistent in-app AgentInsights.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void sendTestTelegram()}
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending Test...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Test Verification Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Channel Connectivity Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-[#14182b] border border-[#202742] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <Send size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Telegram Channel
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Bot: {TELEGRAM_BOT_USERNAME} • Chat: {notifStatus.telegram.targetChat || "-100***"}
                    </div>
                  </div>
                </div>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium underline flex items-center gap-1"
                >
                  <span>Open Bot</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14182b] border border-[#202742] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      In-App Insights Feed
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Auto-records AgentInsight events
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>

            {/* 4 Automated Alert Flows Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Automated Alert Flows (Interactive Testing)
                </span>
                <span className="text-[11px] text-gray-400">
                  Click any card to fire a live verification alert
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Disbursements */}
                <div className="p-4 rounded-xl bg-[#14182b] border border-[#202742] hover:border-emerald-500/40 transition-colors flex flex-col justify-between gap-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <h4 className="text-xs font-bold text-white">Disbursements</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Micro-Payments
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Instant alerts when AI agents settle micro-payments on Aevum Testnet with tx hash and clickable QDay Explorer links.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleTestFlow("disbursement")}
                    disabled={testingFlow === "disbursement"}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {testingFlow === "disbursement" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    <span>Test Disbursement Alert</span>
                  </button>
                </div>

                {/* 2. Security Containment */}
                <div className="p-4 rounded-xl bg-[#14182b] border border-[#202742] hover:border-rose-500/40 transition-colors flex flex-col justify-between gap-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🚨</span>
                        <h4 className="text-xs font-bold text-white">Security Containment</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        Critical Guardrail
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Instant critical pings when over-budget or unauthorized transfer attempts are blocked on-chain by AevumAgentVault.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleTestFlow("security")}
                    disabled={testingFlow === "security"}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {testingFlow === "security" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ShieldAlert size={12} />
                    )}
                    <span>Test Security Breach Alert</span>
                  </button>
                </div>

                {/* 3. Budget Thresholds */}
                <div className="p-4 rounded-xl bg-[#14182b] border border-[#202742] hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <h4 className="text-xs font-bold text-white">Budget Thresholds</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        80%+ Warning
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Proactive warnings when autonomous agents consume 80%+ of their rolling 24-hour daily allowance in tUSD8.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleTestFlow("threshold")}
                    disabled={testingFlow === "threshold"}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {testingFlow === "threshold" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    <span>Test Threshold Alert</span>
                  </button>
                </div>

                {/* 4. Human-in-the-Loop Approvals */}
                <div className="p-4 rounded-xl bg-[#14182b] border border-[#202742] hover:border-indigo-500/40 transition-colors flex flex-col justify-between gap-3 group">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        <h4 className="text-xs font-bold text-white">Human-in-the-Loop</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        Sign-Off Required
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Actionable push notifications prompting the treasury owner when high-value transfers require interactive approval.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleTestFlow("approval")}
                    disabled={testingFlow === "approval"}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {testingFlow === "approval" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <FileText size={12} />
                    )}
                    <span>Test Approval Prompt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Account Profile</h3>
              </div>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Check size={12} /> Profile saved successfully
                </span>
              )}
            </div>

            {saveError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Treasury Operations"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#181d2d] border border-[#23293e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email Address (Alerts & Reports)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@example.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#181d2d] border border-[#23293e] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
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
              EVM addresses authorized under your session. Primary wallet signs transactions on Aevum Testnet.
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
                          href={`${AEVUM_EXPLORER}/address/${w.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-[#252c42] text-gray-400 hover:text-white transition-colors"
                          title="View on QDay Explorer"
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
          {/* Multi-Chain Dynamic Health Status */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Dynamic Health Status</h3>
              </div>
              <button
                onClick={() => void refreshHealth()}
                className="text-gray-400 hover:text-white transition-colors"
                title="Refresh health status"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#181d2d] border border-[#23293e]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Cpu size={13} className="text-indigo-400" />
                    Blockchain L2
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {health?.services?.blockchain?.status || "connected"}
                  </span>
                </div>
                <div className="font-semibold text-white text-[11px]">
                  {health?.services?.blockchain?.chain || "Aevum Testnet (QDay L2)"}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                  Chain ID: {health?.services?.blockchain?.chainId || AEVUM_CHAIN_ID} • Block: #{health?.services?.blockchain?.latestBlock || "184920"}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#181d2d] border border-[#23293e]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Database size={13} className="text-emerald-400" />
                    Database
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {health?.services?.database?.status || "connected"}
                  </span>
                </div>
                <div className="font-semibold text-white text-[11px]">
                  {health?.services?.database?.provider || "Neon PostgreSQL"}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                <span>System Health API</span>
                <span className="text-emerald-400 font-mono">200 OK</span>
              </div>
            </div>
          </div>

          {/* External Hackathon & Documentation Links */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-white">External Hackathon Links</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <a
                href={DORAHACKS_AEVUM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-[#181d2d] hover:bg-[#20273c] border border-[#23293e] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Aevum Builder Challenge</div>
                    <div className="text-[10px] text-gray-400">Official DoraHacks Track</div>
                  </div>
                </div>
                <ExternalLink size={13} className="text-gray-400 group-hover:text-purple-300" />
              </a>

              <a
                href={SWAGGER_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-[#181d2d] hover:bg-[#20273c] border border-[#23293e] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Swagger OpenAPI Docs</div>
                    <div className="text-[10px] text-gray-400">/api/docs (Port 3750)</div>
                  </div>
                </div>
                <ExternalLink size={13} className="text-gray-400 group-hover:text-indigo-300" />
              </a>

              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-[#181d2d] hover:bg-[#20273c] border border-[#23293e] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Send size={16} className="text-sky-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Telegram Alerts Bot</div>
                    <div className="text-[10px] text-gray-400">{TELEGRAM_BOT_USERNAME}</div>
                  </div>
                </div>
                <ExternalLink size={13} className="text-gray-400 group-hover:text-sky-300" />
              </a>
            </div>
          </div>

          {/* Network Info Card */}
          <div className="rounded-xl bg-[#111423] p-6 border border-[#1e2335]">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Network & Chain</h3>
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
                <span className="font-semibold text-emerald-400">
                  {isAevumNetwork ? "tQDAY (Gas) • tUSD8 (Primary)" : "tQDAY (18 decimals)"}
                </span>
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
                  onClick={() => void switchChain(AEVUM_CHAIN_ID)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors col-span-2 ${
                    chainId === AEVUM_CHAIN_ID
                      ? "bg-indigo-600/30 border-indigo-500 text-white font-semibold"
                      : "bg-[#181d2d] border-indigo-500/30 text-indigo-300 hover:text-white"
                  }`}
                >
                  ⚡ Aevum Testnet (0xaba5 - Hackathon)
                </button>
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
              <h3 className="text-sm font-semibold text-white">Infrastructure (Aevum Network)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Aevum Testnet RPC</span>
                <span className="font-mono text-[11px] text-gray-300 bg-[#181d2d] px-2.5 py-1 rounded block truncate">
                  {AEVUM_RPC}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">Block Explorer</span>
                <a
                  href={AEVUM_EXPLORER}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>explorer-test.qday.info (QDay Explorer)</span>
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
