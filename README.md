# 🤖 VAULTIQ — AI Treasury Agent on Aevum Network

> **An autonomous, policy-bounded Web3 treasury platform built for the Aevum Builder Challenge on DoraHacks. VAULTIQ combines context-grounded AI decision-making with strict on-chain smart contract guardrails (`AevumAgentVault.sol`), settlement in `tUSD8`, and real-time push alerts via Telegram (`@VaultAI1bot`).**

[![Aevum Testnet](https://img.shields.io/badge/Aevum%20Testnet-Chain%20ID%2044005-indigo)](https://explorer-test.qday.info)
[![Settlement Token](https://img.shields.io/badge/Settlement%20Asset-tUSD8%20(6%20dec)-emerald)](https://explorer-test.qday.info)
[![Telegram Bot](https://img.shields.io/badge/Telegram%20Alerts-@VaultAI1bot-sky)](https://t.me/VaultAI1bot)
[![DoraHacks](https://img.shields.io/badge/DoraHacks-Aevum%20Builder%20Challenge-purple)](https://dorahacks.io)
[![Swagger](https://img.shields.io/badge/OpenAPI-v1.3.0-blue)](http://localhost:3750/api/docs)

---

## 🏆 Aevum Builder Challenge Highlights

VAULTIQ demonstrates how autonomous AI agents can participate in the on-chain economy **without unrestricted custody of treasury funds**:

1. **Human-Owner Control Boundary**: Smart contract enforcement ensures rogue or hallucinating agents cannot drain treasury reserves.
2. **Post-Quantum Security & QDay L2**: Built natively for **Aevum Testnet** (`Chain ID: 44005 / 0xaba5`) using native `tQDAY` for gas and `tUSD8` as primary settlement.
3. **Interactive Agent Simulator Sandbox (Judges' Favorite)**: Live interactive drawer on [`/allowances`](http://localhost:3000/allowances) demonstrating valid micro-payments vs instant containment alerts when an agent attempts an unauthorized spend.
4. **Dual-Channel Real-Time Push Alerts**: All disbursements, quota warnings, and safety breach containments dispatch live to **Telegram ([@VaultAI1bot](https://t.me/VaultAI1bot))** and persist in the in-app **AgentInsights** feed.
5. **Grounded AI Treasury Assistant**: Floating bottom-right chat drawer grounded in live balance data, anomaly detection, and spending analytics.

---

## 🌐 Network & Smart Contract Specifications

| Parameter | Value |
|---|---|
| **Network Name** | Aevum Testnet (QDay L2) |
| **Chain ID** | `44005` (Hex: `0xaba5`) |
| **RPC Endpoint** | `https://rpc-test.qday.info` |
| **Block Explorer** | [https://explorer-test.qday.info](https://explorer-test.qday.info) |
| **Gas Token** | `tQDAY` (18 decimals) |
| **Primary Settlement Asset** | `tUSD8` (6 decimals) |
| **`tUSD8` Contract Address** | `0x456569838f1d43009A91ebA4263147Afd7233483` |
| **Deployed `AevumAgentVault`** | [`0x13487df8c92df39e8f71f86fc2da9873dbbd68aa`](https://explorer-test.qday.info/address/0x13487df8c92df39e8f71f86fc2da9873dbbd68aa) |
| **Official Telegram Bot** | [@VaultAI1bot](https://t.me/VaultAI1bot) |

---

## 🧠 Architecture Overview

```text
                     TREASURY OWNER (HUMAN)
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       Configure Policies            Interactive Approvals
      (Daily Limit / Whitelist)     (High-Value Transfers)
                │                             │
                ▼                             ▼
   ┌─────────────────────────────────────────────────────┐
   │             AevumAgentVault.sol                     │
   │   - Enforces max single-tx ceiling ($25.00 tUSD8)   │
   │   - Enforces rolling 24-hour daily quota ($100 tUSD8│
   │   - Checks approved recipient endpoints (Allowlist) │
   │   - Reverts unauthorized transactions on-chain      │
   └──────────────────────────┬──────────────────────────┘
                              ▲
                              │ Autonomous micro-payments
                     AUTONOMOUS AI AGENTS
           (Inference Agent, GPU Compute, Data Scrapers)
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │   Dual-Delivery Real-Time Push Alerts    │
        │   1. Telegram Bot (@VaultAI1bot)         │
        │   2. In-App Notification Bell Feed       │
        └──────────────────────────────────────────┘
```

---

## ⭐ Core Features

### 1. Network & Token Switcher (Aevum Support)
* **One-Click Switch**: Automatic `wallet_addEthereumChain` / `wallet_switchEthereumChain` support in MetaMask / EVM wallets.
* **Stablecoin Balance Badge**: Displays live `tUSD8` treasury reserves alongside native `tQDAY` gas balance.

### 2. Dedicated "AI Agent Allowances" Screen (`/allowances`)
* **Fuel Gauge Progress Bar**: Color-coded visualization showing spent vs daily limit:
  * 🟢 **Green**: `< 70%` spent
  * 🟡 **Yellow**: `70% - 90%` spent
  * 🔴 **Red**: `> 90%` spent
* **Single-Tx Ceilings & 24h Countdown**: Live rolling countdown to daily allowance resets.
* **Configure Agent Modal**: Add/edit agent identities, daily spending limits, max single-tx caps, and recipient allowlists calling `setAgentConfig()`.

### 3. Interactive "Agent Simulator" Sandbox (Judges' Favorite)
* **Live Sandbox Widget**: Select an agent (e.g. *DeepSeek Inference Agent*), select an amount via slider ($0.50 – $5,000.00 `tUSD8`), and specify a purpose.
* **Button A ("Run Valid Request")**: Micro-payment succeeds, fuel gauge updates, and a green confirmation toast displays a clickable link to [https://explorer-test.qday.info/tx/{hash}](https://explorer-test.qday.info).
* **Button B ("Test Safety Breach")**: Autonomous agent attempts to spend over budget. `AevumAgentVault.sol` throws `LimitExceeded` revert, and the UI catches it with the shield alert:
  > **🛡️ Over-Budget Request Blocked by AevumAgentVault: Limit Exceeded**
* **Instant Telegram Ping**: Both buttons trigger real-time push alerts to **[@VaultAI1bot](https://t.me/VaultAI1bot)**.

### 4. Real-Time Activity & On-Chain Audit Stream (`/transactions`)
* Filter transactions: **All Transactions**, **AI Autonomous Only**, and **Manual Withdrawals**.
* Full audit metadata: Timestamp, Agent Tag/Address, Recipient, Amount in `tUSD8`, Purpose/Memo, and clickable QDay Explorer transaction links.

### 5. Telegram & In-App Notification Center (`/settings`)
* **Status**: Live connectivity state of **[@VaultAI1bot](https://t.me/VaultAI1bot)** and in-app feed.
* **Verification Test**: One-click **"Send Test Verification Alert"** calling `POST /api/notifications/test-telegram`.
* **4 Automated Push Flows**:
  * 🤖 **Disbursements**: Alerts with transaction hash and QDay explorer link.
  * 🚨 **Security Containment**: Critical instant pings when unauthorized spend attempts are blocked on-chain.
  * ⚠️ **Budget Thresholds**: Warnings when agents consume 80%+ of their daily limits.
  * 📝 **Human-in-the-Loop Approvals**: Prompts when high-value transfers require owner sign-off.
* **Multi-Chain Dynamic Health**: Live health reporting for **Aevum Testnet (QDay L2)** block height and **Neon PostgreSQL** database.

### 6. Grounded AI Treasury Assistant Panel
* Persistent floating chat drawer docking in the bottom right corner of every page.
* Grounded context connected to `POST /api/agent/chat`.
* Quick prompts:
  * *"How much did agents spend in the last 24 hours?"*
  * *"Which agent is closest to its spending limit?"*
  * *"Detect any abnormal transaction spikes."*

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+ or v20+
* An EVM wallet (MetaMask, Rabby)

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/Vaultiq-Web.git
cd Vaultiq-Web

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend & Swagger Documentation

The frontend connects automatically to the live backend. If running the backend locally:

```bash
cd ../AI-Treasury-Backend
npm install
npm run start:dev
```

* **Swagger OpenAPI UI**: 👉 [http://localhost:3750/api/docs](http://localhost:3750/api/docs)
* **Backend Health Check**: [http://localhost:3750/api/health](http://localhost:3750/api/health)
* **Notifications Status**: [http://localhost:3750/api/notifications/status](http://localhost:3750/api/notifications/status)

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── allowances/        # Dedicated AI Agent Allowances & Boundaries screen
│   ├── approvals/         # Human-in-the-loop multi-step approval workflows
│   ├── dashboard/         # Treasury overview, asset distribution, fuel gauges
│   ├── settings/          # Telegram alerts, multi-chain health, Swagger links
│   ├── transactions/      # On-chain audit stream & QDay Explorer links
│   └── treasury/          # Vault deposit, sync, and asset breakdown
├── components/
│   ├── allowances/        # FuelGauge, ConfigureAgentModal
│   ├── simulator/         # Interactive Agent Simulator Sandbox
│   ├── agent/             # FloatingChatDrawer, AgentChat, quick prompts
│   ├── notifications/     # NotificationBellDropdown (In-app dual-delivery feed)
│   ├── wallet/            # WalletButton (One-click switch to Aevum, tUSD8 badge)
│   └── layout/            # DashboardLayout, Sidebar (with @VaultAI1bot pill), Header
├── config/
│   ├── chains.ts          # Viem definition for aevumTestnet (Chain ID 44005)
│   └── constants.ts       # Aevum RPC, Explorer, tUSD8 contract, Telegram bot
├── hooks/
│   ├── useAgentAllowances # Per-agent limits, single-tx caps, simulation engine
│   ├── useNotifications   # Telegram push dispatcher, test alerts, channel status
│   └── useWallet          # SIWE authentication, chain switching, failover
├── lib/
│   ├── api.ts             # API client with automatic failover to cloud backend
│   └── contracts.ts       # AevumAgentVault ABI and viem helpers
└── types/
    ├── agent-allowance.ts # Agent allowance DTOs and audit models
    ├── notification.ts    # Telegram & In-app channel models
    └── health.ts          # Multi-chain dynamic health status
```

---

## 🔐 Security Architecture & Least Privilege

* **No Private Key Custody**: Autonomous agents interact only through designated smart-contract interfaces (`AevumAgentVault.sol`).
* **SIWE Authentication**: Cryptographically signed nonces using EIP-4361 / `personal_sign` and JWT bearer tokens.
* **Failover Redundancy**: Intelligent fallback in [`src/lib/api.ts`](src/lib/api.ts) ensuring continuous operation if a local instance disconnects.
* **On-Chain Containment**: Smart contracts enforce immutable spending ceilings, preventing any agent from draining treasury reserves regardless of AI prompts or hallucination.

---

## 🏆 Hackathon Submission Links

* **DoraHacks Track**: [Aevum Builder Challenge #1](https://dorahacks.io)
* **Official Telegram Alerts Bot**: [@VaultAI1bot](https://t.me/VaultAI1bot)
* **Aevum QDay Block Explorer**: [https://explorer-test.qday.info](https://explorer-test.qday.info)

---

## 📜 License

MIT License. Built for the Aevum Builder Challenge Hackathon.
