export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ai-treasury-backend.onrender.com";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "ai_treasury_token",
  USER: "ai_treasury_user",
  WALLET_ADDRESS: "ai_treasury_address",
} as const;

export const SUPPORTED_CHAINS = [
  {
    id: 97,
    name: "BNB Smart Chain Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    currency: "tBNB",
  },
  {
    id: 56,
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorer: "https://bscscan.com",
    currency: "BNB",
  },
  {
    id: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    currency: "SEP",
  },
  {
    id: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    currency: "ETH",
  },
] as const;

export const DEFAULT_CHAIN_ID = 97; // BSC Testnet

export const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";
export const BSC_MAINNET_EXPLORER = "https://bscscan.com";

export const CHAINS = {
  BSC_TESTNET: 97,
  BSC_MAINNET: 56,
  SEPOLIA: 11155111,
  ETHEREUM: 1,
} as const;

