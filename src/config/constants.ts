export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ai-treasury-backend.onrender.com";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "ai_treasury_token",
  USER: "ai_treasury_user",
  WALLET_ADDRESS: "ai_treasury_address",
  AGENT_ALLOWANCES: "aevum_agent_allowances",
  SIMULATED_TRANSACTIONS: "aevum_simulated_transactions",
} as const;

export const AEVUM_CHAIN_ID = 44005; // 0xaba5
export const AEVUM_EXPLORER = "https://explorer-test.qday.info";
export const AEVUM_RPC = "https://rpc-test.qday.info";
export const DEFAULT_VAULT_ADDRESS = "0x13487df8c92df39e8f71f86fc2da9873dbbd68aa";
export const TUSD8_TOKEN_ADDRESS = "0x456569838f1d43009A91ebA4263147Afd7233483";
export const TELEGRAM_BOT_URL = "https://t.me/VaultAI1bot";
export const TELEGRAM_BOT_USERNAME = "@VaultAI1bot";
export const DORAHACKS_AEVUM_URL = "https://dorahacks.io";
export const SWAGGER_DOCS_URL =
  process.env.NEXT_PUBLIC_SWAGGER_URL || "https://ai-treasury-backend.onrender.com/api/docs";

export const SUPPORTED_CHAINS = [
  {
    id: 44005,
    name: "Aevum Testnet",
    rpcUrl: "https://rpc-test.qday.info",
    blockExplorer: "https://explorer-test.qday.info",
    currency: "tQDAY",
    decimals: 18,
    isPrimary: true,
  },
  {
    id: 97,
    name: "BNB Smart Chain Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    currency: "tBNB",
    decimals: 18,
  },
  {
    id: 56,
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    currency: "BNB",
    decimals: 18,
  },
  {
    id: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    currency: "SEP",
    decimals: 18,
  },
  {
    id: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    currency: "ETH",
    decimals: 18,
  },
] as const;

export const DEFAULT_CHAIN_ID = AEVUM_CHAIN_ID; // Aevum Testnet default

export const CHAINS = {
  AEVUM_TESTNET: 44005,
  BSC_TESTNET: 97,
  BSC_MAINNET: 56,
  SEPOLIA: 11155111,
  ETHEREUM: 1,
} as const;

export const TOKENS = {
  NATIVE: {
    symbol: "tQDAY",
    name: "Aevum QDAY",
    decimals: 18,
  },
  STABLE: {
    symbol: "tUSD8",
    name: "tUSD8 Stablecoin",
    decimals: 6,
    defaultTreasuryBalance: "124,500.00",
  },
} as const;

export function getExplorerTxUrl(txHash?: string | null, chainId: number = DEFAULT_CHAIN_ID): string {
  if (!txHash) return "#";
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const base = chain?.blockExplorer || AEVUM_EXPLORER;
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address?: string | null, chainId: number = DEFAULT_CHAIN_ID): string {
  if (!address) return "#";
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const base = chain?.blockExplorer || AEVUM_EXPLORER;
  return `${base}/address/${address}`;
}

// Backwards compatibility exports
export const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";
export const BSC_MAINNET_EXPLORER = "https://bscscan.com";
